from flask import jsonify, request
from datetime import datetime, timedelta
import json
import os

def log_delete_action(deleted_records, kode_pembayaran, created_at):
    """Log the deletion action to log_delete.log"""
    try:
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        log_entry = f"[{timestamp}] DELETE action - kode_pembayaran: {kode_pembayaran}, created_at: {created_at}, records_deleted: {len(deleted_records)}\n"

        # Append the log entry to the log file
        with open('log_delete.log', 'a', encoding='utf-8') as log_file:
            log_file.write(log_entry)

            # Also add details of each deleted record
            for record in deleted_records:
                record_details = f"  - Deleted record ID: {record.get('id_pembayaranfitrah', 'N/A')}, kode_pembayaran: {record.get('kode_pembayaran', 'N/A')}, created_at: {record.get('created_at', 'N/A')}\n"
                log_file.write(record_details)

        # Add separator for readability
        with open('log_delete.log', 'a', encoding='utf-8') as log_file:
            log_file.write("\n")
    except Exception as e:
        print(f"Error writing to log file: {str(e)}")

def delete_pembayaran_fitrah(supabase_client, req):
    """Delete pembayaran fitrah records with kode_pembayaran and exact created_at date"""
    try:
        # Validate request data
        data = req.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400

        # Both fields are required
        kode_pembayaran = data.get('kode_pembayaran')
        created_at = data.get('created_at')

        if not kode_pembayaran:
            return jsonify({
                'success': False,
                'message': 'kode_pembayaran is required'
            }), 400

        if not created_at:
            return jsonify({
                'success': False,
                'message': 'created_at is required'
            }), 400

        # First, fetch the records that would be deleted to log them
        select_query = supabase_client.table('pembayaran_fitrah').select('*')

        # Add kode_pembayaran filter
        select_query = select_query.eq('kode_pembayaran', kode_pembayaran)

        # Add exact created_at filter
        try:
            # Parse the provided date
            provided_date = datetime.fromisoformat(created_at.replace('Z', '+00:00')) if 'T' in created_at else datetime.strptime(created_at, '%Y-%m-%d')

            # Calculate start and end of the date for exact match query (from beginning to end of day)
            start_of_day = provided_date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_of_day = provided_date.replace(hour=23, minute=59, second=59, microsecond=999999)

            # Convert back to ISO format for Supabase query
            start_str = start_of_day.isoformat() + '+00:00'
            end_str = end_of_day.isoformat() + '+00:00'

            # Filter records within the exact date range
            select_query = select_query.gte('created_at', start_str)
            select_query = select_query.lte('created_at', end_str)
        except ValueError:
            return jsonify({
                'success': False,
                'message': 'Invalid date format. Use YYYY-MM-DD or ISO format.'
            }), 400

        # Execute the select query to see what would be deleted
        select_response = select_query.execute()
        records_to_delete = select_response.data or []

        # Now build the delete query with the same filters
        delete_query = supabase_client.table('pembayaran_fitrah').delete()
        delete_query = delete_query.eq('kode_pembayaran', kode_pembayaran)
        delete_query = delete_query.gte('created_at', start_str)
        delete_query = delete_query.lte('created_at', end_str)

        # Execute the delete query
        response = delete_query.execute()

        if response.data:
            deleted_count = len(response.data)
            # Log the deletion action
            log_delete_action(response.data, kode_pembayaran, created_at)

            return jsonify({
                'success': True,
                'message': f'{deleted_count} pembayaran fitrah record(s) deleted successfully',
                'deleted_count': deleted_count
            })
        else:
            return jsonify({
                'success': False,  # Change to False since both parameters are required and no match found
                'message': 'No pembayaran fitrah records found matching both kode_pembayaran and created_at',
                'deleted_count': 0
            })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500