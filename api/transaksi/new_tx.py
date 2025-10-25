'''API for Creating New Transaction'''
from flask import jsonify, request
from datetime import datetime
import uuid

def create_transaksi(supabase_client, req):
    '''Create a new transaction record'''
    try:
        # Get JSON data from request
        data = req.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'Data tidak boleh kosong'
            }), 400
        
        # Extract required fields
        tanggal_transaksi = data.get('tanggal_transaksi')
        id_akun = data.get('id_akun')
        id_pegawai = data.get('id_pegawai')
        kode_transaksi = data.get('kode_transaksi')
        id_muzakki = data.get('id_muzakki')
        total = data.get('total', 0)
        id_mustahik = data.get('id_mustahik')
        
        # Validate required fields
        if not id_akun:
            return jsonify({
                'success': False,
                'message': 'id_akun diperlukan'
            }), 400
        
        if not id_pegawai:
            return jsonify({
                'success': False,
                'message': 'id_pegawai diperlukan'
            }), 400
        
        if not kode_transaksi:
            return jsonify({
                'success': False,
                'message': 'kode_transaksi diperlukan'
            }), 400
        
        # Validate that kode_transaksi is not already in use
        existing_transaksi = supabase_client.table('transaksi').select('*').eq('kode_transaksi', kode_transaksi).execute()
        
        if existing_transaksi.data:
            return jsonify({
                'success': False,
                'message': f'Kode transaksi "{kode_transaksi}" sudah digunakan'
            }), 400
        
        # Create the transaction object
        new_transaksi = {
            'id_akun': id_akun,
            'id_pegawai': id_pegawai,
            'kode_transaksi': kode_transaksi,
            'id_muzakki': id_muzakki,
            'total': total,
            'id_mustahik': id_mustahik
        }
        
        # Only include tanggal_transaksi if it's provided
        if tanggal_transaksi:
            new_transaksi['tanggal_transaksi'] = tanggal_transaksi
        
        # Insert into the database
        response = supabase_client.table('transaksi').insert(new_transaksi).execute()
        
        return jsonify({
            'success': True,
            'message': 'Transaksi berhasil dibuat',
            'data': response.data[0] if response.data else None
        })
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500