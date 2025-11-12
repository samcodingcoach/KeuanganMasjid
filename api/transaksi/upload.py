from flask import jsonify, request
from werkzeug.utils import secure_filename
import os

def upload_bukti(supabase_client):
    '''Upload a file to Supabase storage'''
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400

        # Get filename from form data, or use original if not provided
        filename = request.form.get('filename', file.filename)
        
        if file:
            # Define bucket and path
            bucket_name = 'MasjidBukti'
            
            # Upload to Supabase
            response = supabase_client.storage.from_(bucket_name).upload(
                path=filename,
                file=file.read(), # Read the file content as bytes
                file_options={'content-type': file.content_type}
            )

            # Get public URL
            public_url = supabase_client.storage.from_(bucket_name).get_public_url(filename)

            return jsonify({
                'success': True,
                'message': 'File uploaded successfully',
                'url': public_url
            })

    except Exception as e:
        print(f"Error uploading file to Supabase: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
