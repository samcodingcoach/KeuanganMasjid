from flask import jsonify, request
from datetime import datetime, timedelta
import random
import string

def create_pembayaran_fitrah(supabase_client, req):
    """Create a new pembayaran fitrah record with required kode_pembayaran"""
    try:
        # Validate request data
        data = req.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400

        # Required fields validation
        required_fields = ['kode_pembayaran', 'id_muzakki', 'id_hargafitrah', 'id_pegawai', 'id_akun', 'jumlah']
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400

        # Extract data
        kode_pembayaran = data.get('kode_pembayaran')
        id_muzakki = data.get('id_muzakki')
        id_hargafitrah = data.get('id_hargafitrah')
        id_pegawai = data.get('id_pegawai')
        id_akun = data.get('id_akun')
        jumlah = data.get('jumlah')
        total_berat = data.get('total_berat')
        total_uang = data.get('total_uang')
        lunas = data.get('lunas', False)
        bukti = data.get('bukti')

        # Check if kode_pembayaran already exists to ensure uniqueness
        check_response = supabase_client.table('pembayaran_fitrah').select('kode_pembayaran').eq('kode_pembayaran', kode_pembayaran).execute()
        if check_response.data:
            return jsonify({
                'success': False,
                'message': 'kode_pembayaran already exists'
            }), 400

        # Prepare record for insertion
        new_record = {
            'kode_pembayaran': kode_pembayaran,
            'id_muzakki': id_muzakki,
            'id_hargafitrah': id_hargafitrah,
            'id_pegawai': id_pegawai,
            'id_akun': id_akun,
            'jumlah': jumlah,
            'total_berat': total_berat,
            'total_uang': total_uang,
            'lunas': lunas,
            'bukti': bukti
        }

        # Insert into Supabase
        response = supabase_client.table('pembayaran_fitrah').insert(new_record).execute()

        if response.data:
            # Get the created record with related information
            created_record = response.data[0]

            # Format the response with GMT+8 timestamp
            formatted_record = {
                'id_pembayaranfitrah': created_record['id_pembayaranfitrah'],
                'kode_pembayaran': created_record['kode_pembayaran'],
                'id_muzakki': created_record['id_muzakki'],
                'id_hargafitrah': created_record['id_hargafitrah'],
                'id_pegawai': created_record['id_pegawai'],
                'id_akun': created_record['id_akun'],
                'jumlah': created_record['jumlah'],
                'total_berat': created_record['total_berat'],
                'total_uang': created_record['total_uang'],
                'lunas': created_record['lunas'],
                'bukti': created_record['bukti']
            }

            # Format created_at to GMT+8
            if created_record.get('created_at'):
                try:
                    created_at_dt = datetime.fromisoformat(created_record['created_at'].replace('Z', '+00:00'))
                    gmt8_dt = created_at_dt + timedelta(hours=8)
                    formatted_record['created_at'] = gmt8_dt.strftime('%Y-%m-%d %H:%M')
                except Exception as e:
                    print(f"Error formatting date: {e}")
                    formatted_record['created_at'] = created_record['created_at']

            return jsonify({
                'success': True,
                'message': 'Pembayaran fitrah created successfully',
                'data': formatted_record
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to create pembayaran fitrah'
            }), 500

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500