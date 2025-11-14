'''API for Closing Transactions'''
from flask import jsonify, request

def close_transaction(supabase_client, request):
    '''Close a transaction by setting isClose = 1 based on id_transaksi'''
    try:
        # Get the request data
        data = request.get_json()

        # Validate required fields
        if not data or 'id_transaksi' not in data:
            return jsonify({
                'success': False,
                'message': 'id_transaksi is required'
            }), 400

        id_transaksi = data['id_transaksi']

        # Validate id_transaksi is not empty
        if not id_transaksi:
            return jsonify({
                'success': False,
                'message': 'id_transaksi cannot be empty'
            }), 400

        # Update the transaction to set isClose = 1
        response = supabase_client.table('transaksi').update({
            'isClose': 1
        }).eq('id_transaksi', id_transaksi).execute()

        # Check if any rows were updated
        if not response.data:
            return jsonify({
                'success': False,
                'message': f'Transaction with id_transaksi {id_transaksi} not found'
            }), 404

        return jsonify({
            'success': True,
            'message': f'Transaksi dengan id {id_transaksi} berhasil ditutup',
            'data': response.data[0]  # Return the updated record
        })

    except Exception as e:
        print(f"Error closing transaction: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500