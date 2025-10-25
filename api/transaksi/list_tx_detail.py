'''API for Transaction Detail List'''
from flask import jsonify, request
from datetime import datetime

def get_transaksi_detail_list(supabase_client):
    '''Get transaction details for a specific transaction with related data (kategori_transaksi, transaksi)'''
    try:
        # Get the required id_transaksi from query parameters
        id_transaksi = request.args.get('id_transaksi')
        
        if not id_transaksi:
            return jsonify({
                'success': False,
                'message': 'Parameter id_transaksi diperlukan'
            }), 400
        
        # Build the query to get transaction details for the specific transaction
        # First, get the transaction to verify it exists
        transaksi_response = supabase_client.table('transaksi').select('*').eq('id_transaksi', id_transaksi).execute()
        
        if not transaksi_response.data:
            return jsonify({
                'success': False,
                'message': f'Transaksi dengan id_transaksi {id_transaksi} tidak ditemukan'
            }), 404
        
        # Get transaction details for that transaction
        detail_response = supabase_client.table('transaksi_detail').select('*').eq('id_transaksi', id_transaksi).execute()
        
        if not detail_response.data:
            return jsonify({
                'success': False,
                'message': f'Tidak ada detail transaksi untuk id_transaksi {id_transaksi}',
                'data': []
            })
        
        details = detail_response.data
        
        # Extract unique IDs for batch fetching related data
        kategori_ids = list(set([d['id_kategori'] for d in details if d.get('id_kategori')]))
        
        # Fetch related data in batches
        kategori_data = {}
        if kategori_ids:
            kategori_response = supabase_client.table('kategori_transaksi').select('*').in_('id_kategori', kategori_ids).execute()
            kategori_data = {item['id_kategori']: item for item in kategori_response.data or []}
        
        # Build the result with joined data
        result = []
        for detail in details:
            item = {
                'id_detail': detail.get('id_detail'),
                'created_at': detail.get('created_at'),
                'deskripsi': detail.get('deskripsi'),
                'kode_transaksi': transaksi_response.data[0].get('kode_transaksi'),
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
            if item['created_at']:
                try:
                    created_at = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
                    item['created_at'] = created_at.strftime('%Y-%m-%d %H:%M:%S')
                except ValueError:
                    pass  # Keep original if parsing fails
            
            result.append(item)
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result),
            'id_transaksi': id_transaksi
        })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500