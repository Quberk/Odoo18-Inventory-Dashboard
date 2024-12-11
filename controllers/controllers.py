# -*- coding: utf-8 -*-
# from odoo import http


# class InventoryDashboard(http.Controller):
#     @http.route('/inventory_dashboard/inventory_dashboard', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/inventory_dashboard/inventory_dashboard/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('inventory_dashboard.listing', {
#             'root': '/inventory_dashboard/inventory_dashboard',
#             'objects': http.request.env['inventory_dashboard.inventory_dashboard'].search([]),
#         })

#     @http.route('/inventory_dashboard/inventory_dashboard/objects/<model("inventory_dashboard.inventory_dashboard"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('inventory_dashboard.object', {
#             'object': obj
#         })

