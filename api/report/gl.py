from flask import Blueprint, request, jsonify
from datetime import datetime

gl_bp = Blueprint('gl', __name__)

@gl_bp.route('/gl', methods=['GET'])  # This creates the route /api/laporan/gl
def get_general_ledger():
    try:
        # Get date parameters - using ts and tf as per your request
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

        # Using Supabase client to fetch data
        # We need to join multiple tables: transaksi_detail, kategori_transaksi, transaksi, and akun_kas_bank

        # Build query for transaksi_detail records
        query = supabase.table('transaksi_detail').select(
            'id_detail, created_at, subtotal, deskripsi, id_kategori, transaksi!inner(id_transaksi, id_akun)'
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

        query = query.order('created_at', desc=False).order('id_transaksi', desc=False).order('id_detail', desc=False)
        detail_response = query.execute()

        if not detail_response.data:
            return jsonify({
                'status': 'success',
                'data': [],
                'ts': tanggal_awal,
                'tf': tanggal_akhir
            }), 200

        # Get unique category IDs
        category_ids = list(set([detail['id_kategori'] for detail in detail_response.data]))

        # Get category information
        categories_response = (
            supabase.table('kategori_transaksi')
            .select('id_kategori, nama_kategori, jenis_kategori')
            .in_('id_kategori', category_ids)
        ).execute()

        # Create a mapping of category ID to category information
        category_map = {cat['id_kategori']: cat for cat in categories_response.data}

        # Get unique account IDs from transactions
        account_ids = list(set([detail['transaksi']['id_akun'] for detail in detail_response.data]))

        # Get account information
        accounts_response = (
            supabase.table('akun_kas_bank')
            .select('id_akun, nama_akun, no_referensi, nama_bank')
            .in_('id_akun', account_ids)
        ).execute()

        # Create a mapping of account ID to account information
        account_map = {acc['id_akun']: acc for acc in accounts_response.data}

        # Process results to match the required format
        data = []
        running_balance = 0

        for detail in detail_response.data:
            category_info = category_map.get(detail['id_kategori'], {})
            account_info = account_map.get(detail['transaksi']['id_akun'], {})

            # Calculate debet and kredit
            debet = detail['subtotal'] if category_info.get('jenis_kategori') == 'Penerimaan' else 0
            kredit = detail['subtotal'] if category_info.get('jenis_kategori') == 'Pengeluaran' else 0

            # Update running balance
            if category_info.get('jenis_kategori') == 'Penerimaan':
                running_balance += detail['subtotal']
            elif category_info.get('jenis_kategori') == 'Pengeluaran':
                running_balance -= detail['subtotal']

            # Format the date
            created_at = datetime.fromisoformat(detail['created_at'].replace('Z', '+00:00'))
            formatted_date = created_at.strftime('%d %b %Y, %H:%M')

            # Create the record - handling None values in sumber
            nama_akun = account_info.get('nama_akun', '') or ''
            no_referensi = account_info.get('no_referensi', '') or ''
            nama_bank = account_info.get('nama_bank', '') or ''

            # Build sumber string, avoiding None values
            parts = []
            if nama_akun:
                parts.append(nama_akun)
            if no_referensi:
                parts.append(f"({no_referensi})")
            if nama_bank:
                parts.append(nama_bank)

            sumber = ' '.join(parts) if parts else ''

            record = {
                'tanggal': formatted_date,
                'sumber': sumber,
                'nama_kategori': category_info.get('nama_kategori', '') or '',
                'debet': debet,
                'kredit': kredit,
                'saldo': running_balance,
                'ket': detail.get('deskripsi', '') or ''
            }
            data.append(record)

        return jsonify({
            'status': 'success',
            'data': data,
            'ts': tanggal_awal,
            'tf': tanggal_akhir
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'An error occurred: {str(e)}'
        }), 500