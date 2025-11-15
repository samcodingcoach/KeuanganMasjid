from flask import jsonify
from datetime import datetime, timedelta

def get_proyek_fitrah_list(supabase_client):
    """Get all proyek_fitrah data ordered by created_at (newest first) with GMT+8 formatting"""
    try:
        # Get data from supabase, ordered by created_at descending (newest first)
        response = supabase_client.table('proyek_fitrah').select(
            'id_fitrah, created_at, tahun_hijriah, penanggung_jawab, aktif'
        ).order('created_at', desc=True).execute()

        if response.data:
            formatted_data = []

            for record in response.data:
                # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                if record.get('created_at'):
                    try:
                        # Convert to datetime object
                        created_at_dt = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))

                        # Add 8 hours for GMT+8
                        gmt8_dt = created_at_dt + timedelta(hours=8)

                        # Format to 'YYYY-MM-DD HH:mm'
                        record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                    except Exception as e:
                        # If parsing fails, keep original format
                        print(f"Error formatting date: {e}")
                        pass

                formatted_data.append(record)

            return jsonify({
                'success': True,
                'data': formatted_data,
                'count': len(formatted_data)
            })
        else:
            return jsonify({
                'success': True,
                'message': 'No proyek_fitrah data found',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500