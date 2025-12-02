from flask import jsonify, request
from datetime import datetime, timedelta
import random
import string

def create_penyaluran_fitrah(supabase_client, req):
    """Create a new penyaluran fitrah record"""
    try:
        # Validate request data
        data = req.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400

        # Required fields validation (id_akun and bukti_foto are optional)
        required_fields = ['kode_penyaluran', 'id_fitrah', 'id_pegawai', 'id_mustahik', 'jumlah_uang', 'jumlah_beras', 'tanggal_penerimaan', 'id_stokberas']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400

        # Extract data
        kode_penyaluran = data.get('kode_penyaluran')
        id_fitrah = data.get('id_fitrah')
        id_pegawai = data.get('id_pegawai')
        id_mustahik = data.get('id_mustahik')
        jumlah_uang = data.get('jumlah_uang')
        jumlah_beras = data.get('jumlah_beras')
        bukti_foto = data.get('bukti_foto')  # Optional field
        tanggal_penerimaan = data.get('tanggal_penerimaan')
        id_akun = data.get('id_akun')  # Optional field
        id_stokberas = data.get('id_stokberas')

        # Check if kode_penyaluran already exists to ensure uniqueness
        check_response = supabase_client.table('penyaluran_fitrah').select('kode_penyaluran').eq('kode_penyaluran', kode_penyaluran).execute()
        if check_response.data:
            return jsonify({
                'success': False,
                'message': 'kode_penyaluran already exists'
            }), 400

        # Validate date format (expecting YYYY-MM-DD HH:mm or YYYY-MM-DD or ISO format)
        try:
            if isinstance(tanggal_penerimaan, str):
                # Check if it's datetime format like YYYY-MM-DD HH:mm
                if ' ' in tanggal_penerimaan:
                    tanggal_penerimaan_dt = datetime.strptime(tanggal_penerimaan, '%Y-%m-%d %H:%M')
                    formatted_tanggal_penerimaan = tanggal_penerimaan_dt.isoformat()
                # Check if it's ISO format
                elif 'T' in tanggal_penerimaan:
                    tanggal_penerimaan_dt = datetime.fromisoformat(tanggal_penerimaan.replace('T', ' ').replace('Z', ''))
                    formatted_tanggal_penerimaan = tanggal_penerimaan_dt.isoformat()
                else:
                    # It's a date string, convert to datetime at start of day
                    tanggal_penerimaan_dt = datetime.strptime(tanggal_penerimaan, '%Y-%m-%d')
                    formatted_tanggal_penerimaan = tanggal_penerimaan_dt.isoformat()
            else:
                return jsonify({
                    'success': False,
                    'message': 'Invalid date format for tanggal_penerimaan. Expected YYYY-MM-DD HH:mm, YYYY-MM-DD or ISO format'
                }), 400
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format for tanggal_penerimaan. Expected YYYY-MM-DD HH:mm, YYYY-MM-DD or ISO format'
            }), 400

        # Prepare record for insertion
        new_record = {
            'kode_penyaluran': kode_penyaluran,
            'id_fitrah': id_fitrah,
            'id_pegawai': id_pegawai,
            'id_mustahik': id_mustahik,
            'jumlah_uang': jumlah_uang,
            'jumlah_beras': jumlah_beras,
            'tanggal_penerimaan': formatted_tanggal_penerimaan,
            'id_stokberas': id_stokberas
        }

        # Add optional fields only if they exist in the request
        if bukti_foto is not None:
            new_record['bukti_foto'] = bukti_foto

        if id_akun is not None:
            new_record['id_akun'] = id_akun

        # Insert into Supabase
        response = supabase_client.table('penyaluran_fitrah').insert(new_record).execute()

        if response.data:
            # Get the created record
            created_record = response.data[0]

            # Format the response with GMT+8 timestamp
            formatted_record = {
                'id_penyaluran': created_record.get('id_penyaluran'),
                'kode_penyaluran': created_record.get('kode_penyaluran'),
                'id_fitrah': created_record.get('id_fitrah'),
                'id_pegawai': created_record.get('id_pegawai'),
                'id_mustahik': created_record.get('id_mustahik'),
                'jumlah_uang': created_record.get('jumlah_uang'),
                'jumlah_beras': created_record.get('jumlah_beras'),
                'tanggal_penerimaan': created_record.get('tanggal_penerimaan'),
                'id_stokberas': created_record.get('id_stokberas')
            }

            # Add optional fields if they exist in the response
            if created_record.get('bukti_foto') is not None:
                formatted_record['bukti_foto'] = created_record.get('bukti_foto')

            if created_record.get('id_akun') is not None:
                formatted_record['id_akun'] = created_record.get('id_akun')

            # Format created_at to GMT+8 if it exists
            if created_record.get('created_at'):
                try:
                    created_at_dt = datetime.fromisoformat(created_record['created_at'].replace('Z', '+00:00'))
                    gmt8_dt = created_at_dt + timedelta(hours=8)
                    formatted_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    print(f"Error formatting created_at date: {e}")
                    formatted_record['created_at'] = created_record['created_at']

            # Format tanggal_penerimaan if it exists
            if created_record.get('tanggal_penerimaan'):
                try:
                    if isinstance(created_record['tanggal_penerimaan'], str):
                        tanggal_penerimaan_dt = datetime.fromisoformat(created_record['tanggal_penerimaan'].replace('Z', '+00:00'))
                        gmt8_dt = tanggal_penerimaan_dt + timedelta(hours=8)
                        formatted_record['tanggal_penerimaan'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    print(f"Error formatting tanggal_penerimaan: {e}")
                    formatted_record['tanggal_penerimaan'] = created_record['tanggal_penerimaan']

            return jsonify({
                'success': True,
                'message': 'Penyaluran fitrah created successfully',
                'data': formatted_record
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create penyaluran fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500