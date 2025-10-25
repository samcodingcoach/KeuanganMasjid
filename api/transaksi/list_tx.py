'''API for Transaction List'''
from flask import jsonify
from datetime import datetime

def get_transaksi_list(supabase_client):
    '''Get all transactions with related data (akun, pegawai, muzakki, mustahik)'''
    try:
        # Get all transactions
        transaksi_response = supabase_client.table('transaksi').select('*').execute()
        
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
        
        # Build the result with joined data
        result = []
        for transaksi in transactions:
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
                'total': transaksi.get('total')
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
            'count': len(result)
        })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500