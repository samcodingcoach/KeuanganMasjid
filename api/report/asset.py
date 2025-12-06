from flask import Blueprint, request, jsonify
from datetime import datetime

report_asset_bp = Blueprint('report_asset', __name__)

@report_asset_bp.route('/laporan.asset', methods=['GET'])
def get_laporan_asset():
    """
    API endpoint to get asset report from transaksi_detail table
    where isAsset = true
    """
    try:
        # Get date range from query parameters
        tanggal_awal = request.args.get('ts')
        tanggal_akhir = request.args.get('tf')

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

        # First get transaksi_detail where isAsset = true
        detail_response = (
            supabase.table('transaksi_detail')
            .select('created_at, subtotal, id_kategori, id_transaksi')
            .eq('isAsset', True)
            .gte('created_at', tanggal_awal)
            .lte('created_at', tanggal_akhir)
        ).execute()

        if not detail_response.data:
            return jsonify({
                'status': 'success',
                'data': [],
                'ts': tanggal_awal,
                'tf': tanggal_akhir,
                'periode': f'{tanggal_awal} s.d {tanggal_akhir}'
            }), 200

        # Get unique IDs
        transaction_ids = list(set([detail['id_transaksi'] for detail in detail_response.data if detail.get('id_transaksi')]))
        category_ids = list(set([detail['id_kategori'] for detail in detail_response.data if detail.get('id_kategori')]))

        # Get transaction data
        transactions_map = {}
        if transaction_ids:
            trans_response = (
                supabase.table('transaksi')
                .select('id_transaksi, id_akun')
                .in_('id_transaksi', transaction_ids)
            ).execute()
            transactions_map = {t['id_transaksi']: t for t in trans_response.data}

        # Get category data
        categories_map = {}
        if category_ids:
            cat_response = (
                supabase.table('kategori_transaksi')
                .select('id_kategori, nama_kategori, jenis_kategori')
                .in_('id_kategori', category_ids)
            ).execute()
            categories_map = {c['id_kategori']: c for c in cat_response.data}

        # Get account data
        account_ids = list(set([t['id_akun'] for t in transactions_map.values() if t.get('id_akun')]))
        accounts_map = {}
        if account_ids:
            acc_response = (
                supabase.table('akun_kas_bank')
                .select('id_akun, nama_akun')
                .in_('id_akun', account_ids)
            ).execute()
            accounts_map = {a['id_akun']: a for a in acc_response.data}

        # Build result
        result = []
        for detail in detail_response.data:
            trans_info = transactions_map.get(detail.get('id_transaksi'), {})
            account_info = accounts_map.get(trans_info.get('id_akun'), {})
            category_info = categories_map.get(detail.get('id_kategori'), {})

            result.append({
                'tanggal': detail['created_at'],
                'nama_akun': account_info.get('nama_akun', ''),
                'nama_kategori': category_info.get('nama_kategori', ''),
                'jenis_kategori': category_info.get('jenis_kategori', ''),
                'subtotal': detail['subtotal']
            })

        # Sort result by tanggal descending (newest first)
        result.sort(key=lambda x: x['tanggal'], reverse=True)

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
