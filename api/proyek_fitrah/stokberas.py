from flask import jsonify
from datetime import datetime, timedelta

def get_stok_beras(supabase_client):
    """Get stok_beras data joined with proyek_fitrah"""
    try:
        # Get all stok_beras data
        response = supabase_client.table('stok_beras').select(
            'id_stokberas, update_at, id_fitrah, jumlah, aktif'
        ).execute()

        if response.data:
            # Get all ids to fetch related data
            id_fitrah_list = [record['id_fitrah'] for record in response.data if record.get('id_fitrah')]

            # Get proyek_fitrah data for those ids
            proyek_fitrah_response = supabase_client.table('proyek_fitrah').select(
                'id_fitrah, tahun_hijriah, penanggung_jawab'
            ).in_('id_fitrah', id_fitrah_list).execute()

            # Create mapping from id_fitrah to proyek_fitrah data
            proyek_fitrah_map = {}
            if proyek_fitrah_response.data:
                proyek_fitrah_map = {item['id_fitrah']: item for item in proyek_fitrah_response.data}

            # Format the data with joined proyek_fitrah data
            formatted_data = []

            for record in response.data:
                # Format datetime if exists
                if record.get('update_at'):
                    try:
                        # Convert to datetime object
                        update_at_dt = datetime.fromisoformat(record['update_at'].replace('Z', '+00:00'))

                        # Add 8 hours for GMT+8
                        gmt8_dt = update_at_dt + timedelta(hours=8)

                        # Format to 'YYYY-MM-DD HH:mm'
                        record['update_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                    except Exception as e:
                        # If parsing fails, keep original format
                        print(f"Error formatting date: {e}")
                        pass

                # Add proyek_fitrah data to the record
                id_fitrah = record.get('id_fitrah')
                proyek_data = proyek_fitrah_map.get(id_fitrah, {})
                
                # Create final record with all required fields
                final_record = {
                    'id_stokberas': record.get('id_stokberas'),
                    'update_at': record.get('update_at'),
                    'tahun_hijriah': proyek_data.get('tahun_hijriah'),
                    'penanggung_jawab': proyek_data.get('penanggung_jawab'),
                    'jumlah': record.get('jumlah'),
                    'aktif': record.get('aktif')
                }

                formatted_data.append(final_record)

            return jsonify({
                'success': True,
                'data': formatted_data,
                'count': len(formatted_data)
            })
        else:
            return jsonify({
                'success': True,
                'message': 'No stok_beras data found',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
