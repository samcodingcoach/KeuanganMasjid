'''API for Transaction List'''
from flask import jsonify, request
from datetime import datetime

def get_transaksi_list(supabase_client):
    '''Get all transactions with related data (akun, pegawai, muzakki, mustahik)'''
    try:
        # Build the query with potential filters
        query = supabase_client.table('transaksi').select('*')
        
        # Handle query parameters for filtering
        id_transaksi = request.args.get('id_transaksi')
        kode_transaksi = request.args.get('kode_transaksi')
        tanggal_transaksi = request.args.get('tanggal_transaksi')
        
        if id_transaksi:
            query = query.eq('id_transaksi', id_transaksi)
        
        if kode_transaksi:
            query = query.eq('kode_transaksi', kode_transaksi)
        
        if tanggal_transaksi:
            # Filter by date (only records with this specific date)
            try:
                # Parse the date to ensure it's valid
                date_obj = datetime.strptime(tanggal_transaksi, '%Y-%m-%d')
                # Format to match Supabase ISO format
                date_str = date_obj.strftime('%Y-%m-%d')
                # Filter records between start and end of the day
                start_date = f"{date_str} 00:00:00"
                end_date = f"{date_str} 23:59:59"
                query = query.gte('tanggal_transaksi', start_date).lte('tanggal_transaksi', end_date)
            except ValueError:
                return jsonify({
                    'success': False,
                    'message': 'Format tanggal_transaksi tidak valid. Gunakan format YYYY-MM-DD'
                }), 400
        
        # Execute the query
        transaksi_response = query.execute()
        
        if not transaksi_response.data:
            return jsonify({
                'success': False,
                'message': 'Tidak ada data transaksi',
                'data': []
            })
        
        transactions = transaksi_response.data
        
        # Extract unique IDs for batch fetching related data
        akun_ids = list(set([t['id_akun'] for t in transactions if t.get('id_akun')]))
        pegawai_ids = list(set([t['id_pegawai'] for t in transactions if t.get('id_pegawai')]))
        muzakki_ids = list(set([t['id_muzakki'] for t in transactions if t.get('id_muzakki')]))
        mustahik_ids = list(set([t['id_mustahik'] for t in transactions if t.get('id_mustahik')]))
        
        # Fetch related data in batches
        akun_data = {}
        if akun_ids:
            akun_response = supabase_client.table('akun_kas_bank').select('*').in_('id_akun', akun_ids).execute()
            akun_data = {item['id_akun']: item for item in akun_response.data or []}
        
        pegawai_data = {}
        if pegawai_ids:
            pegawai_response = supabase_client.table('pegawai').select('*').in_('id_pegawai', pegawai_ids).execute()
            pegawai_data = {item['id_pegawai']: item for item in pegawai_response.data or []}
        
        muzakki_data = {}
        if muzakki_ids:
            muzakki_response = supabase_client.table('muzakki').select('*').in_('id_muzakki', muzakki_ids).execute()
            muzakki_data = {item['id_muzakki']: item for item in muzakki_response.data or []}
        
        mustahik_data = {}
        if mustahik_ids:
            mustahik_response = supabase_client.table('mustahik').select('*').in_('id_mustahik', mustahik_ids).execute()
            mustahik_data = {item['id_mustahik']: item for item in mustahik_response.data or []}
        
        # Extract all transaction IDs for fetching details
        transaction_ids = [t['id_transaksi'] for t in transactions]
        
        # Fetch transaction details for all transactions
        transaksi_detail_data = {}
        if transaction_ids:
            detail_response = supabase_client.table('transaksi_detail').select('*').in_('id_transaksi', transaction_ids).execute()
            if detail_response.data:
                # Group details by transaction ID
                for detail in detail_response.data:
                    transaksi_id = detail.get('id_transaksi')
                    if transaksi_id not in transaksi_detail_data:
                        transaksi_detail_data[transaksi_id] = []
                    transaksi_detail_data[transaksi_id].append(detail)
        
        # Get unique category IDs from all details to fetch category data
        all_kategori_ids = set()
        for details_list in transaksi_detail_data.values():
            for detail in details_list:
                if detail.get('id_kategori'):
                    all_kategori_ids.add(detail['id_kategori'])
        
        # Fetch category data
        kategori_data = {}
        if all_kategori_ids:
            kategori_response = supabase_client.table('kategori_transaksi').select('*').in_('id_kategori', list(all_kategori_ids)).execute()
            kategori_data = {item['id_kategori']: item for item in kategori_response.data or []}
        
        # Build the result with joined data and nested details
        result = []
        for transaksi in transactions:
            # Build transaction details with related category data
            details_list = []
            if transaksi.get('id_transaksi') in transaksi_detail_data:
                for detail in transaksi_detail_data[transaksi['id_transaksi']]:
                    detail_item = {
                        'id_detail': detail.get('id_detail'),
                        'created_at': detail.get('created_at'),
                        'deskripsi': detail.get('deskripsi'),
                        'kode_transaksi': transaksi.get('kode_transaksi'),
                        'id_kategori': detail.get('id_kategori'),
                        'nama_kategori': kategori_data.get(detail.get('id_kategori'), {}).get('nama_kategori'),
                        'jenis_kategori': kategori_data.get(detail.get('id_kategori'), {}).get('jenis_kategori'),
                        'jumlah': detail.get('jumlah'),
                        'nominal': detail.get('nominal'),
                        'isAsset': detail.get('isAsset'),
                        'subtotal': detail.get('subtotal'),
                        'id_transaksi': detail.get('id_transaksi')
                    }
                    
                    # Format created_at if it exists
                    if detail_item['created_at']:
                        try:
                            created_at = datetime.fromisoformat(detail_item['created_at'].replace('Z', '+00:00'))
                            detail_item['created_at'] = created_at.strftime('%Y-%m-%d %H:%M:%S')
                        except ValueError:
                            pass  # Keep original if parsing fails
                    
                    details_list.append(detail_item)
            
            # Create the main transaction item with nested details
            item = {
                'id_transaksi': transaksi.get('id_transaksi'),
                'tanggal_transaksi': transaksi.get('tanggal_transaksi'),
                'id_akun': transaksi.get('id_akun'),
                'nama_akun': akun_data.get(transaksi.get('id_akun'), {}).get('nama_akun'),
                'jenis_akun': akun_data.get(transaksi.get('id_akun'), {}).get('jenis_akun'),
                'no_referensi': akun_data.get(transaksi.get('id_akun'), {}).get('no_referensi'),
                'id_pegawai': transaksi.get('id_pegawai'),
                'nama_lengkap': pegawai_data.get(transaksi.get('id_pegawai'), {}).get('nama_lengkap'),
                'role': pegawai_data.get(transaksi.get('id_pegawai'), {}).get('role'),
                'kode_transaksi': transaksi.get('kode_transaksi'),
                'id_muzakki': transaksi.get('id_muzakki'),
                'nama_muzakki': muzakki_data.get(transaksi.get('id_muzakki'), {}).get('nama_lengkap'),
                'id_mustahik': transaksi.get('id_mustahik'),
                'nama_mustahik': mustahik_data.get(transaksi.get('id_mustahik'), {}).get('nama_lengkap'),
                'total': transaksi.get('total'),
                'details': details_list  # Add the nested details
            }
            
            # Format tanggal_transaksi if it exists
            if item['tanggal_transaksi']:
                try:
                    tanggal = datetime.fromisoformat(item['tanggal_transaksi'].replace('Z', '+00:00'))
                    item['tanggal_transaksi'] = tanggal.strftime('%Y-%m-%d %H:%M:%S')
                except ValueError:
                    pass  # Keep original if parsing fails
            
            result.append(item)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result),
            'filters_applied': {
                'id_transaksi': id_transaksi,
                'kode_transaksi': kode_transaksi,
                'tanggal_transaksi': tanggal_transaksi
            } if any([id_transaksi, kode_transaksi, tanggal_transaksi]) else None
        })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500