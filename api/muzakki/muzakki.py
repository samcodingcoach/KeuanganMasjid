from flask import Blueprint, request, jsonify
from api.muzakki.new import create_muzakki
from api.muzakki.update import update_muzakki
from datetime import datetime
import os

# Create blueprint
muzakki_bp = Blueprint('muzakki', __name__)

# Import Supabase client from main app
supabase_client = None

def init_supabase(client):
    global supabase_client
    supabase_client = client

@muzakki_bp.route('/api/muzakki.create', methods=['POST'])
def create_muzakki_route():
    """Endpoint to create a new muzakki"""
    if not supabase_client:
        return jsonify({'success': False, 'error': 'Database client not initialized'}), 500
    
    return create_muzakki(supabase_client, request)

@muzakki_bp.route('/api/muzakki.update', methods=['PUT'])
def update_muzakki_route():
    """Endpoint to update an existing muzakki"""
    if not supabase_client:
        return jsonify({'success': False, 'error': 'Database client not initialized'}), 500
    
    muzakki_id = request.args.get('id_muzakki')
    if not muzakki_id:
        return jsonify({'success': False, 'message': 'Muzakki ID is required as query parameter'}), 400
    
    return update_muzakki(supabase_client, request, muzakki_id)

@muzakki_bp.route('/api/muzakki.get', methods=['GET'])
def get_muzakki_list_route():
    """Endpoint to get all muzakki data"""
    if not supabase_client:
        return jsonify({'success': False, 'error': 'Database client not initialized'}), 500
    
    try:
        response = supabase_client.table('muzakki').select(
            'id_muzakki, nama_lengkap, alamat, no_telepon, no_ktp, gps, fakir, tanggal_lahir, aktif, keterangan, created_at, kategori'
        ).execute()

        if response.data:
            formatted_data = []
            for record in response.data:
                # Parsing timestamp from ISO 8601 format (e.g., 2025-10-21T10:20:30.123456+00:00)
                if record.get('created_at'):
                    try:
                        created_at_dt = datetime.fromisoformat(record['created_at'])
                        # Format back to 'YYYY-MM-DD HH:mm'
                        record['created_at'] = created_at_dt.strftime('%Y-%m-%d %H:%M')
                    except:
                        pass  # Keep original format if parsing fails
                
                # Format tanggal_lahir if it exists
                if record.get('tanggal_lahir'):
                    try:
                        tanggal_lahir_dt = datetime.fromisoformat(record['tanggal_lahir'])
                        record['tanggal_lahir'] = tanggal_lahir_dt.strftime('%Y-%m-%d')
                    except:
                        pass  # Keep original format if parsing fails
                
                formatted_data.append(record)
            
            return jsonify({
                'success': True,
                'data': formatted_data,
                'count': len(formatted_data)
            })
        else:
            return jsonify({
                'success': True, 
                'message': 'No muzakki data found',
                'data': []
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@muzakki_bp.route('/api/muzakki.delete', methods=['DELETE'])
def delete_muzakki_route():
    """Endpoint to delete a muzakki"""
    if not supabase_client:
        return jsonify({'success': False, 'error': 'Database client not initialized'}), 500
    
    muzakki_id = request.args.get('id_muzakki')
    if not muzakki_id:
        return jsonify({'success': False, 'message': 'Muzakki ID is required as query parameter'}), 400
    
    try:
        response = supabase_client.table('muzakki').delete().eq('id_muzakki', muzakki_id).execute()
        
        if response.data:
            return jsonify({
                'success': True,
                'message': 'Muzakki data successfully deleted'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'No muzakki found with the provided ID'
            }), 404
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500