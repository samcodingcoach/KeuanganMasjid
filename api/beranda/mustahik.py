from flask import jsonify


def get_total_mustahik(supabase_client):
    """
    Get total count of active mustahik
    """
    try:
        # Fetch count of active mustahik
        response = supabase_client.table('mustahik').select(
            'id_mustahik'
        ).eq('aktif', True).execute()

        if not response.data:
            total_mustahik = 0
        else:
            total_mustahik = len(response.data)

        result = {
            'total_mustahik': total_mustahik
        }

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_total_mustahik: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500