from odoo import models, fields, api



class InheritProductProduct(models.Model):
    _inherit = 'product.product'
    
    @api.model
    def get_stock_at_time(self, product_id, date_time):
        print("Get Stock at Time")
        StockMove = self.env["stock.move"]
        domain = [
            ("product_id", "=", product_id),
            ("state", "=", "done"),
            ("date", "<=", date_time),
        ]

        stock_moves = StockMove.search(domain)

        # Calculate the quantity based on move type
        stock_quantity = sum(move.product_uom_qty if move.location_dest_id.usage == "internal" else -move.product_uom_qty
                             for move in stock_moves)

        return stock_quantity

