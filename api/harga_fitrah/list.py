from flask import jsonify
from datetime import datetime, timedelta

def get_harga_fitrah_list(supabase_client):
    """Get all harga_fitrah data with related information from proyek_fitrah, jenis_fitrah, and pegawai tables ordered by id_hargafitrah (newest first) with GMT+8 formatting"""
    try:
        # Get all harga_fitrah data ordered by id_hargafitrah descending (newest first)
        harga_fitrah_response = supabase_client.table('harga_fitrah').select('*').order('id_hargafitrah', desc=True).execute()

        if not harga_fitrah_response.data:
            return jsonify({
                'success': True,
                'message': 'No harga_fitrah data found',
                'data': [],
                'count': 0
            })

        # Extract unique IDs for related tables to fetch in batches
        id_fitrah_list = list(set([record['id_fitrah'] for record in harga_fitrah_response.data if record.get('id_fitrah')]))
        id_jenis_fitrah_list = list(set([record['id_jenis_fitrah'] for record in harga_fitrah_response.data if record.get('id_jenis_fitrah')]))
        id_pegawai_list = list(set([record['id_pegawai'] for record in harga_fitrah_response.data if record.get('id_pegawai')]))

        # Fetch related data in batches
        proyek_fitrah_data = {}
        if id_fitrah_list:
            proyek_response = supabase_client.table('proyek_fitrah').select('id_fitrah, tahun_hijriah').in_('id_fitrah', id_fitrah_list).execute()
            proyek_fitrah_data = {item['id_fitrah']: item for item in proyek_response.data or []}

        jenis_fitrah_data = {}
        if id_jenis_fitrah_list:
            jenis_response = supabase_client.table('jenis_fitrah').select('id_jenis_fitrah, nama_jenis').in_('id_jenis_fitrah', id_jenis_fitrah_list).execute()
            jenis_fitrah_data = {item['id_jenis_fitrah']: item for item in jenis_response.data or []}

        pegawai_data = {}
        if id_pegawai_list:
            pegawai_response = supabase_client.table('pegawai').select('id_pegawai, nama_lengkap').in_('id_pegawai', id_pegawai_list).execute()
            pegawai_data = {item['id_pegawai']: item for item in pegawai_response.data or []}

        # Format the response with joined data
        formatted_data = []
        for record in harga_fitrah_response.data:
            # Parse and format the created_at timestamp to GMT+8
            formatted_record = {
                'id_hargafitrah': record['id_hargafitrah'],
                'id_fitrah': record['id_fitrah'],
                'id_jenis_fitrah': record['id_jenis_fitrah'],
                'id_pegawai': record['id_pegawai'],
                'keterangan': record['keterangan'],
                'nominal': record['nominal'],
                'berat': record['berat'],
                'aktif': record['aktif']
            }

            # Add formatted created_at
            if record.get('created_at'):
                try:
                    # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                    created_at_dt = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))

                    # Add 8 hours for GMT+8
                    gmt8_dt = created_at_dt + timedelta(hours=8)

                    # Format to 'YYYY-MM-DD HH24:MI'
                    formatted_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    # If parsing fails, keep original format
                    print(f"Error formatting date: {e}")
                    formatted_record['created_at'] = record['created_at']

            # Add related data from joined tables
            if record.get('id_fitrah') in proyek_fitrah_data:
                formatted_record['tahun_hijriah'] = proyek_fitrah_data[record['id_fitrah']]['tahun_hijriah']

            if record.get('id_jenis_fitrah') in jenis_fitrah_data:
                formatted_record['nama_jenis'] = jenis_fitrah_data[record['id_jenis_fitrah']]['nama_jenis']

            if record.get('id_pegawai') in pegawai_data:
                formatted_record['nama_lengkap'] = pegawai_data[record['id_pegawai']]['nama_lengkap']

            formatted_data.append(formatted_record)

        return jsonify({
            'success': True,
            'data': formatted_data,
            'count': len(formatted_data)
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500