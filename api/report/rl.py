from flask import Blueprint, request, jsonify
from datetime import datetime

rl_bp = Blueprint('rl', __name__)

@rl_bp.route('/rl', methods=['GET'])  # This creates the route /api/laporan/rl
def get_profit_loss():
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

        # Build query for transaksi_detail records
        query = supabase.table('transaksi_detail').select(
            'subtotal, id_kategori, transaksi!inner(id_transaksi, id_akun)'
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

        # Group data by jenis_kategori -> nama_akun -> nama_kategori and sum(subtotal)
        # Structure: {jenis_kategori: {nama_akun: {nama_kategori: total}}}
        grouped_data = {}

        for detail in detail_response.data:
            category_info = category_map.get(detail['id_kategori'], {})
            account_info = account_map.get(detail['transaksi']['id_akun'], {})

            jenis_kategori = category_info.get('jenis_kategori', '')
            nama_akun = account_info.get('nama_akun', '')
            nama_kategori = category_info.get('nama_kategori', '')

            # Initialize the nested structure if not exists
            if jenis_kategori not in grouped_data:
                grouped_data[jenis_kategori] = {}

            if nama_akun not in grouped_data[jenis_kategori]:
                grouped_data[jenis_kategori][nama_akun] = {}

            if nama_kategori not in grouped_data[jenis_kategori][nama_akun]:
                grouped_data[jenis_kategori][nama_akun][nama_kategori] = 0

            # Add subtotal to existing value
            grouped_data[jenis_kategori][nama_akun][nama_kategori] += detail['subtotal']

        # Format the response data in hierarchical structure as required
        result = []

        # Add title
        result.append({
            'type': 'title',
            'text': f'Laporan Rugi Laba Bulan {datetime.strptime(tanggal_awal, "%Y-%m-%d").strftime("%B")} {datetime.strptime(tanggal_awal, "%Y-%m-%d").year}',
            'periode': f'{tanggal_awal} s.d {tanggal_akhir}'
        })

        # Calculate and add Penerimaan section
        total_penerimaan = 0
        if 'Penerimaan' in grouped_data:
            result.append({
                'type': 'section',
                'name': 'Penerimaan'
            })

            for account_name, categories in grouped_data['Penerimaan'].items():
                result.append({
                    'type': 'account',
                    'name': account_name
                })

                for category_name, total in categories.items():
                    result.append({
                        'type': 'category',
                        'name': category_name,
                        'amount': total
                    })
                    total_penerimaan += total

            result.append({
                'type': 'section_total',
                'label': 'Total Penerimaan',
                'amount': total_penerimaan
            })
        else:
            result.append({
                'type': 'section',
                'name': 'Penerimaan'
            })
            result.append({
                'type': 'section_total',
                'label': 'Total Penerimaan',
                'amount': 0
            })

        # Calculate and add Pengeluaran section
        total_pengeluaran = 0
        if 'Pengeluaran' in grouped_data:
            result.append({
                'type': 'section',
                'name': 'Pengeluaran'
            })

            for account_name, categories in grouped_data['Pengeluaran'].items():
                result.append({
                    'type': 'account',
                    'name': account_name
                })

                for category_name, total in categories.items():
                    result.append({
                        'type': 'category',
                        'name': category_name,
                        'amount': total
                    })
                    total_pengeluaran += total

            result.append({
                'type': 'section_total',
                'label': 'Total Pengeluaran',
                'amount': total_pengeluaran
            })
        else:
            result.append({
                'type': 'section',
                'name': 'Pengeluaran'
            })
            result.append({
                'type': 'section_total',
                'label': 'Total Pengeluaran',
                'amount': 0
            })

        # Add final calculation
        net_profit_loss = total_penerimaan - total_pengeluaran
        result.append({
            'type': 'net_total',
            'label': 'Penerimaan-Pengeluaran',
            'amount': net_profit_loss
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