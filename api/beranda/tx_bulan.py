from flask import jsonify
from datetime import datetime
import calendar


def get_monthly_transactions_by_category(supabase_client):
    """
    Get transaction totals grouped by category for the current month
    """
    try:
        # Get the first and last day of the current month
        today = datetime.today()
        first_day_of_month = today.replace(day=1)
        last_day_of_month = today.replace(day=calendar.monthrange(today.year, today.month)[1])

        # Format dates as string for Supabase query
        first_day_str = first_day_of_month.strftime('%Y-%m-%d')
        last_day_str = last_day_of_month.strftime('%Y-%m-%d')

        # First, fetch all transaction details for the current month
        response = supabase_client.table('transaksi_detail').select(
            'id_kategori, subtotal, created_at'
        ).gte('created_at', first_day_str).lte('created_at', last_day_str).execute()

        if not response.data:
            return jsonify({
                'success': True,
                'data': [],
                'message': 'Tidak ada transaksi untuk bulan ini'
            })

        # Extract all category IDs to fetch their names
        category_ids = [item['id_kategori'] for item in response.data if item['id_kategori']]
        if not category_ids:
            return jsonify({
                'success': True,
                'data': [],
                'message': 'Tidak ada kategori transaksi untuk bulan ini'
            })

        # Fetch category names
        categories_response = supabase_client.table('kategori_transaksi').select(
            'id_kategori, jenis_kategori'
        ).in_('id_kategori', category_ids).execute()

        # Create a mapping from category ID to category name
        category_map = {}
        if categories_response.data:
            for cat in categories_response.data:
                category_map[cat['id_kategori']] = cat['jenis_kategori']

        # Group transaction totals by category
        totals_by_category = {}
        for item in response.data:
            id_kategori = item['id_kategori']
            subtotal = item['subtotal']

            # Only process if the category exists and subtotal is not None
            if id_kategori and subtotal is not None and id_kategori in category_map:
                category_name = category_map[id_kategori]

                # Convert subtotal to float for calculation
                try:
                    subtotal = float(subtotal) if isinstance(subtotal, (str, int)) else subtotal
                except (ValueError, TypeError):
                    continue  # Skip invalid subtotal values

                if category_name not in totals_by_category:
                    totals_by_category[category_name] = 0
                totals_by_category[category_name] += subtotal

        # Format the results
        result = []
        for category_name, total_amount in totals_by_category.items():
            result.append({
                'jenis_kategori': category_name,
                'total_subtotal': total_amount
            })

        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        })

    except Exception as e:
        # Log the error for debugging
        print(f"Error in get_monthly_transactions_by_category: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500