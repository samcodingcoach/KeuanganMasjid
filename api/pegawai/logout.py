from flask import jsonify
from datetime import datetime

def logout_pegawai():
    """Handle employee logout"""
    try:
        # Just return success response - frontend handles clearing session storage
        return jsonify({
            'success': True,
            'message': 'Logout berhasil.'
        }), 200

    except Exception as e:
        print(f"Error during logout: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500