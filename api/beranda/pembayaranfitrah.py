from flask import jsonify
from datetime import datetime, timedelta


def get_pembayaran_fitrah_summary(supabase_client):
    """
    Get summary of zakat fitrah payments for the last 30 days
    """
    try:
        # Calculate the date 30 days ago
        date_30_days_ago = datetime.now() - timedelta(days=30)
        date_str = date_30_days_ago.strftime('%Y-%m-%d')
        
        # Fetch zakat fitrah payments from the last 30 days
        response = supabase_client.table('pembayaran_fitrah').select(
            'total_berat, total_uang'
        ).gte('created_at', date_str).execute()

        total_berat = 0
        total_uang = 0
        
        if response.data:
            for item in response.data:
                # Process total_berat
                berat = item.get('total_berat')
                if berat is not None:
                    try:
                        berat = float(berat) if isinstance(berat, (str, int)) else berat
                        total_berat += berat
                    except (ValueError, TypeError):
                        pass  # Skip invalid values
                
                # Process total_uang
                uang = item.get('total_uang')
                if uang is not None:
                    try:
                        uang = float(uang) if isinstance(uang, (str, int)) else uang
                        total_uang += uang
                    except (ValueError, TypeError):
                        pass  # Skip invalid values

        result = {
            'total_berat': total_berat,
            'total_uang': total_uang
        }

        return jsonify({
            'success': True,
            'data': result
        })

    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_pembayaran_fitrah_summary: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500