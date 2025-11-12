from flask import jsonify
import os

def get_config():
    """
    Returns the Supabase configuration.
    """
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_KEY')

    if not supabase_url or not supabase_key:
        return jsonify({'error': 'Supabase URL and Key are not configured on the server.'}), 500

    return jsonify({
        'supabase_url': supabase_url,
        'supabase_key': supabase_key
    })
