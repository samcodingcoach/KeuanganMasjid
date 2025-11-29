from flask import Blueprint, request, jsonify
from datetime import datetime

aruskas_bp = Blueprint('aruskas', __name__)

@aruskas_bp.route('/aruskas', methods=['GET'])  # This creates the route /api/laporan/aruskas
def get_aruskas():
    try:
        # Get date parameters
        tanggal_awal = request.args.get('ts')
        tanggal_akhir = request.args.get('tf')
        keyword = request.args.get('keyword')

        # If no dates provided, default to current month
        if not tanggal_awal or not tanggal_akhir:
            today = datetime.now()
            tanggal_awal = f'{today.year}-{today.month:02d}-01'

            # Calculate last day of current month
            if today.month == 12:
                next_month = datetime(today.year + 1, 1, 1)
            else:
                next_month = datetime(today.year, today.month + 1, 1)
            last_day = (next_month - datetime(today.year, today.month, 1)).days
            tanggal_akhir = f'{today.year}-{today.month:02d}-{last_day:02d}'

        # Import supabase client from main module
        from main import supabase

        # Execute the SQL query directly using Supabase
        # Joining transaksi_detail, transaksi, akun_kas_bank, and kategori_transaksi
        query = supabase.table('transaksi_detail').select(
            'created_at, subtotal, id_kategori, transaksi!inner(id_transaksi, id_akun)'
        ).gte('created_at', tanggal_awal).lte('created_at', tanggal_akhir)

        # Add keyword filter if provided
        if keyword:
            # First get the category IDs that match the search term
            category_response = (
                supabase.table('kategori_transaksi')
                .select('id_kategori')
                .ilike('nama_kategori', f'%{keyword}%')
            ).execute()

            if category_response.data:
                category_ids = [cat['id_kategori'] for cat in category_response.data]
                if category_ids:
                    query = query.in_('id_kategori', category_ids)
            else:
                # If no matching categories found, return empty result
                return jsonify({
                    'status': 'success',
                    'data': [],
                    'ts': tanggal_awal,
                    'tf': tanggal_akhir
                }), 200

        query = query.order('created_at', desc=False).order('id_transaksi', desc=False)
        detail_response = query.execute()

        if not detail_response.data:
            return jsonify({
                'status': 'success',
                'data': [],
                'ts': tanggal_awal,
                'tf': tanggal_akhir
            }), 200

        # Get unique category IDs and account IDs
        category_ids = list(set([detail['id_kategori'] for detail in detail_response.data]))
        account_ids = list(set([detail['transaksi']['id_akun'] for detail in detail_response.data]))

        # Get category information
        categories_response = (
            supabase.table('kategori_transaksi')
            .select('id_kategori, nama_kategori, jenis_kategori')
            .in_('id_kategori', category_ids)
        ).execute()

        # Get account information
        accounts_response = (
            supabase.table('akun_kas_bank')
            .select('id_akun, nama_akun')
            .in_('id_akun', account_ids)
        ).execute()

        # Create mappings
        category_map = {cat['id_kategori']: cat for cat in categories_response.data}
        account_map = {acc['id_akun']: acc for acc in accounts_response.data}

        # Group data by account name
        grouped_data = {}
        for detail in detail_response.data:
            account_info = account_map.get(detail['transaksi']['id_akun'], {})
            category_info = category_map.get(detail['id_kategori'], {})

            account_name = account_info.get('nama_akun', '')
            category_name = category_info.get('nama_kategori', '')
            jenis_kategori = category_info.get('jenis_kategori', '')

            # If the category is an expense (Pengeluaran), the amount should be negative in net calculation
            # But we show the absolute value in the category detail
            current_amount = detail['subtotal']
            current_amount_display = abs(detail['subtotal'])

            if account_name not in grouped_data:
                grouped_data[account_name] = {
                    'account_name': account_name,
                    'categories': {},
                    'total_net': 0
                }

            # Group by category_name and jenis_kategori, sum the subtotals
            category_key = (category_name, jenis_kategori)
            if category_key not in grouped_data[account_name]['categories']:
                grouped_data[account_name]['categories'][category_key] = {
                    'category_name': category_name,
                    'subtotal': 0,
                    'jenis_kategori': jenis_kategori  # Store to know if it's income or expense
                }

            # Add the amount to the existing subtotal for this category/type combination
            grouped_data[account_name]['categories'][category_key]['subtotal'] += current_amount_display

            # Update net total for this account
            # Income: add positive, Expense: subtract (add negative)
            if jenis_kategori == 'Penerimaan':
                grouped_data[account_name]['total_net'] += current_amount
            else:  # Pengeluaran
                grouped_data[account_name]['total_net'] -= current_amount

        # Calculate total for all accounts
        total_all_accounts = sum(account_data['total_net'] for account_data in grouped_data.values())

        # Convert grouped data to the required hierarchical format
        result = []
        for account_name, account_data in grouped_data.items():
            # Add account header (Group)
            result.append({
                'type': 'group',
                'name': account_name
            })

            # Add subcategories (Subgroup) with their amounts
            # For expenses (Pengeluaran), we display the amount in negative form in brackets
            for category_key, category in account_data['categories'].items():
                if category['jenis_kategori'] == 'Pengeluaran':
                    # Show expenses as negative values in brackets
                    display_subtotal = -category['subtotal']
                else:
                    # Income (Penerimaan) shown as positive
                    display_subtotal = category['subtotal']

                result.append({
                    'type': 'subcategory',
                    'name': category['category_name'],
                    'subtotal': display_subtotal,
                    'jenis_kategori': category['jenis_kategori']
                })

            # Add net total for this account
            result.append({
                'type': 'net_total',
                'label': f'Total Bersih {account_name}',
                'total': account_data['total_net']
            })

        # Add final total
        result.append({
            'type': 'final_total',
            'label': 'Total Akhir',
            'total': total_all_accounts
        })

        return jsonify({
            'status': 'success',
            'data': result,
            'ts': tanggal_awal,
            'tf': tanggal_akhir,
            'periode': f'{tanggal_awal} s.d {tanggal_akhir}'
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }), 500