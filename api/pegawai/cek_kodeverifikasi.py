from flask import jsonify, request
import os
from dotenv import load_dotenv

def cek_kodeverifikasi(supabase, request):
    """Check if verification code exists and is valid"""
    try:
        data = request.get_json()
        email = data.get('email')
        kode_verifikasi = data.get('kode_verifikasi')
        
        print(f"Received email: {email}, kode_verifikasi: {kode_verifikasi}")  # Debug log
        
        if not all([email, kode_verifikasi]):
            return jsonify({'success': False, 'message': 'Email dan kode verifikasi diperlukan', 'valid': False}), 400
        
        # Check if verification code exists with status FALSE, ordered by id_reset descending, limit 1
        # Try both boolean formats (False and 0) since database might store it differently
        result = supabase.table('resetpassword').select('*').eq('email', email).eq('kode_verifikasi', kode_verifikasi).eq('status', False).order('id_reset', desc=True).limit(1).execute()
        
        # If no result with False, try with 0 (for some database systems)
        if not result.data:
            result = supabase.table('resetpassword').select('*').eq('email', email).eq('kode_verifikasi', kode_verifikasi).eq('status', 0).order('id_reset', desc=True).limit(1).execute()
        
        print(f"Query result: {result}")  # Debug log
        print(f"Data found: {result.data}")  # Debug log
        
        if result.data:
            # Update the status to TRUE (used) - try both True and 1 for database compatibility
            reset_id = result.data[0]['id_reset']
            update_result = supabase.table('resetpassword').update({'status': True}).eq('id_reset', reset_id).execute()
            
            # If update with True fails, try with 1
            if not update_result.data:
                update_result = supabase.table('resetpassword').update({'status': 1}).eq('id_reset', reset_id).execute()
            
            print(f"Update result: {update_result}")  # Debug log
            
            if update_result.data:
                return jsonify({'success': True, 'message': 'Kode verifikasi valid', 'valid': True})
            else:
                return jsonify({'success': False, 'message': 'Gagal memperbarui status kode verifikasi', 'valid': False}), 500
        else:
            return jsonify({'success': False, 'message': 'Kode verifikasi salah atau telah kedaluwarsa', 'valid': False}), 400
    
    except Exception as e:
        print(f"Error checking verification code: {e}")  # Debug log
        return jsonify({'success': False, 'message': 'Terjadi kesalahan saat memeriksa kode verifikasi', 'valid': False}), 500