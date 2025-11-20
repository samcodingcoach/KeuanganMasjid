"""API to get total balance by account type"""
from flask import jsonify
from collections import defaultdict


def get_total_by_account_type(supabase_client):
    """Get total balance grouped by account type."""
    try:
        # Fetch all records from akun_kas_bank table
        response = supabase_client.table('akun_kas_bank').select('jenis_akun, saldo_akhir').execute()
        
        if not response.data:
            return jsonify({
                'success': False,
                'message': 'Tidak ada data atau RLS policy memblokir akses',
                'data': []
            })
        
        # Group by jenis_akun and sum the saldo_akhir
        grouped_data = defaultdict(float)
        
        for item in response.data:
            jenis_akun = item.get('jenis_akun')
            saldo_akhir = item.get('saldo_akhir')
            
            # Handle cases where saldo_akhir might be None or string
            if saldo_akhir is not None:
                try:
                    # Convert to float if it's a string
                    saldo_akhir = float(saldo_akhir) if isinstance(saldo_akhir, (str, int)) else saldo_akhir
                except (ValueError, TypeError):
                    # If conversion fails, skip this record
                    continue
                
                grouped_data[jenis_akun] += saldo_akhir
        
        # Format the result as a list of dictionaries
        result = []
        for jenis_akun, total_saldo in grouped_data.items():
            result.append({
                'jenis_akun': jenis_akun,
                'total_saldo': total_saldo
            })
        
        return jsonify({
            'success': True,
            'data': result,
            'count': len(result)
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500