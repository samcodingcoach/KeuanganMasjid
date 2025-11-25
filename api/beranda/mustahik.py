from flask import jsonify


def get_total_mustahik(supabase_client):
    """
    Get total count of mustahik including both active and inactive
    """
    try:
        # Fetch count of active mustahik
        response_active = supabase_client.table('mustahik').select(
            'id_mustahik'
        ).eq('aktif', True).execute()

        # Fetch count of inactive mustahik
        response_inactive = supabase_client.table('mustahik').select(
            'id_mustahik'
        ).eq('aktif', False).execute()

        if not response_active.data:
            total_aktif = 0
        else:
            total_aktif = len(response_active.data)

        if not response_inactive.data:
            total_tidak_aktif = 0
        else:
            total_tidak_aktif = len(response_inactive.data)

        total_mustahik = total_aktif + total_tidak_aktif

        result = {
            'total_mustahik': total_mustahik,
            'total_aktif': total_aktif,
            'total_tidak_aktif': total_tidak_aktif
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