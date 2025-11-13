from flask import jsonify, request
from werkzeug.utils import secure_filename
import os
from PIL import Image
import io

def upload_asset_image(supabase_client):
    '''Upload an asset image to Supabase storage with compression if needed'''
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400

        # Get filename from form data, or use original if not provided
        filename = request.form.get('filename', file.filename)
        
        # Secure the filename
        filename = secure_filename(filename)

        # Check file type - only allow jpg/jpeg
        if file and (not file.content_type.lower().startswith('image/jpeg') and 
                     not file.filename.lower().endswith(('.jpg', '.jpeg'))):
            return jsonify({'success': False, 'message': 'Only JPG/JPEG files are allowed'}), 400

        # Read file content
        file_content = file.read()

        # Check file size before processing - 500KB limit
        file_size_kb = len(file_content) / 1024
        if file_size_kb > 500:
            # Compress the image
            file_content = compress_image(file_content)

        if file:
            # Define bucket name for asset images
            bucket_name = 'AssetImage'

            # Upload to Supabase
            response = supabase_client.storage.from_(bucket_name).upload(
                path=filename,
                file=file_content,
                file_options={'content-type': 'image/jpeg'}
            )

            # Get public URL
            public_url = supabase_client.storage.from_(bucket_name).get_public_url(filename)

            return jsonify({
                'success': True,
                'message': 'Image uploaded successfully',
                'url': public_url
            })

    except Exception as e:
        print(f"Error uploading asset image to Supabase: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


def compress_image(image_bytes):
    '''Compress image to be under 500KB with quality reduction'''
    try:
        # Open image using PIL
        image_stream = io.BytesIO(image_bytes)
        image = Image.open(image_stream)
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if image.mode in ('RGBA', 'P'):
            image = image.convert('RGB')
        
        # Initial quality
        quality = 95
        max_quality = 95
        min_quality = 10
        
        # Try to compress the image to under 500KB
        while quality >= min_quality:
            # Save image to bytes with current quality
            output_stream = io.BytesIO()
            image.save(output_stream, format='JPEG', quality=quality, optimize=True)
            compressed_bytes = output_stream.getvalue()
            
            # Check the size
            size_kb = len(compressed_bytes) / 1024
            
            if size_kb <= 500:
                return compressed_bytes
            
            # If still too large, reduce quality
            quality -= 10
        
        # If we can't get under 500KB, return the lowest quality version
        return compressed_bytes
        
    except Exception as e:
        print(f"Error compressing image: {e}")
        # If compression fails, return original bytes
        return image_bytes