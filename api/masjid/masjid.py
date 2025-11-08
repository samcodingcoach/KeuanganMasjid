'''Api for Masjid'''
from flask import jsonify
from datetime import datetime
from zoneinfo import ZoneInfo

def get_masjid(supabase_client):
    '''Get all masjid data'''
    try:
        response = supabase_client.table('masjid').select('*').execute()

        if response.data:
            # Process the data to convert created_at to GMT+8 and format as "YYYY-MM-DD HH:mm"
            processed_data = []
            for item in response.data:
                if 'created_at' in item and item['created_at']:
                    # Parse the ISO format datetime string
                    utc_time = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
                    # Convert to GMT+8 timezone
                    gmt8_time = utc_time.astimezone(ZoneInfo('Asia/Makassar'))  # Using Asia/Makassar as GMT+8
                    # Format as "YYYY-MM-DD HH:mm"
                    formatted_time = gmt8_time.strftime('%Y-%m-%d %H:%M')
                    # Create a new item with the formatted time
                    processed_item = {**item}
                    processed_item['created_at'] = formatted_time
                    processed_data.append(processed_item)
                else:
                    processed_data.append(item)
            
            return jsonify({
                'success': True,
                'data': processed_data,
                'count': len(processed_data)
            })
        return jsonify({
            'success': False,
            'message': 'Tidak ada data atau RLS policy memblokir akses',
            'data': []
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500