from flask import jsonify, request
from datetime import datetime, timedelta

def delete_pembayaran_fitrah(supabase_client, req):
    """Delete pembayaran fitrah records with kode_pembayaran and exact created_at date"""
    try:
        # Validate request data
        data = req.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400

        # Both fields are required
        kode_pembayaran = data.get('kode_pembayaran')
        created_at = data.get('created_at')

        if not kode_pembayaran:
            return jsonify({
                'success': False,
                'message': 'kode_pembayaran is required'
            }), 400

        if not created_at:
            return jsonify({
                'success': False,
                'message': 'created_at is required'
            }), 400

        # Build query with both kode_pembayaran and exact created_at
        query = supabase_client.table('pembayaran_fitrah').delete()

        # Add kode_pembayaran filter
        query = query.eq('kode_pembayaran', kode_pembayaran)

        # Add exact created_at filter
        try:
            # Parse the provided date
            provided_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')) if 'T' in created_at else datetime.strptime(created_at, '%Y-%m-%d')

            # Calculate start and end of the date for exact match query (from beginning to end of day)
            start_of_day = provided_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = provided_date.replace(hour=23, minute=59, second=59, microsecond=999999)

            # Convert back to ISO format for Supabase query
            start_str = start_of_day.isoformat() + '+00:00'
            end_str = end_of_day.isoformat() + '+00:00'

            # Filter records within the exact date range
            query = query.gte('created_at', start_str)
            query = query.lte('created_at', end_str)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD or ISO format.'
            }), 400

        # Execute the delete query
        response = query.execute()

        if response.data:
            deleted_count = len(response.data)
            return jsonify({
                'success': True,
                'message': f'{deleted_count} pembayaran fitrah record(s) deleted successfully',
                'deleted_count': deleted_count
            })
        else:
            return jsonify({
                'success': False,  # Change to False since both parameters are required and no match found
                'message': 'No pembayaran fitrah records found matching both kode_pembayaran and created_at',
                'deleted_count': 0
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500