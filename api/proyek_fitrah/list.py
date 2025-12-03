from flask import jsonify
from datetime import datetime, timedelta

def get_proyek_fitrah_list(supabase_client):
    """Get all proyek_fitrah data with calculated totals for received money, received rice, and distributed rice"""
    try:
        # Get all proyek_fitrah data ordered by created_at descending
        response = supabase_client.table('proyek_fitrah').select(
            'id_fitrah, created_at, tahun_hijriah, penanggung_jawab, aktif'
        ).order('created_at', desc=True).execute()

        if response.data:
            # Get all ids to fetch related data
            id_fitrah_list = [record['id_fitrah'] for record in response.data]

            # Calculate total penyaluran for each project
            penyaluran_response = supabase_client.table('penyaluran_fitrah').select(
                'id_fitrah, jumlah_beras'
            ).in_('id_fitrah', id_fitrah_list).execute()

            # Calculate total pembayaran for each project (both rice and money)
            pembayaran_response = supabase_client.table('pembayaran_fitrah').select(
                'id_hargafitrah, total_berat, total_uang'
            ).execute()

            # Get related harga_fitrah to map to id_fitrah
            if pembayaran_response.data:
                id_hargafitrah_list = list(set([record['id_hargafitrah'] for record in pembayaran_response.data if record.get('id_hargafitrah')]))
                harga_fitrah_response = supabase_client.table('harga_fitrah').select(
                    'id_hargafitrah, id_fitrah'
                ).in_('id_hargafitrah', id_hargafitrah_list).execute()

                # Create mapping from id_hargafitrah to id_fitrah
                harga_fitrah_map = {}
                if harga_fitrah_response.data:
                    harga_fitrah_map = {item['id_hargafitrah']: item['id_fitrah'] for item in harga_fitrah_response.data}

                # Calculate total received rice and money per id_fitrah
                total_terimaberas = {}
                total_terimauang = {}

                for pembayaran in pembayaran_response.data:
                    id_hargafitrah = pembayaran['id_hargafitrah']
                    if id_hargafitrah in harga_fitrah_map:
                        id_fitrah = harga_fitrah_map[id_hargafitrah]

                        if id_fitrah not in total_terimaberas:
                            total_terimaberas[id_fitrah] = 0
                        if id_fitrah not in total_terimauang:
                            total_terimauang[id_fitrah] = 0

                        total_terimaberas[id_fitrah] += pembayaran.get('total_berat', 0) or 0
                        total_terimauang[id_fitrah] += pembayaran.get('total_uang', 0) or 0
            else:
                total_terimaberas = {}
                total_terimauang = {}

            # Calculate total distributed rice per id_fitrah
            total_salurberas = {}
            if penyaluran_response.data:
                for penyaluran in penyaluran_response.data:
                    id_fitrah = penyaluran['id_fitrah']

                    if id_fitrah not in total_salurberas:
                        total_salurberas[id_fitrah] = 0

                    total_salurberas[id_fitrah] += penyaluran.get('jumlah_beras', 0) or 0

            # Format the data with calculated totals
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

                # Add calculated totals to the record
                id_fitrah = record['id_fitrah']
                record['total_terimauang'] = total_terimauang.get(id_fitrah, 0)
                record['total_terimaberas'] = total_terimaberas.get(id_fitrah, 0)
                record['total_salurberas'] = total_salurberas.get(id_fitrah, 0)

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