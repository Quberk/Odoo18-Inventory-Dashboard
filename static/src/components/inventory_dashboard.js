import { registry } from "@web/core/registry"
const { Component, onWillStart, useRef, onMounted, useState} = owl
import { StockCard } from "./stock_card/stock_card"
import { useService } from "@web/core/utils/hooks"
import { ChartRenderer } from "./chart_renderer/chart_renderer"
import { loadJS } from "@web/core/assets"


export class OwlInventoryDashboard extends Component {
    setup(){
        this.state = useState({
            incoming_picking: {
                value:0,
                percentage:0,
            },
            outgoing_picking: {
                value:0,
                percentage:0,
            },
            product_categories: [],
            period:0,
            currentCategory:0,
            labels:[],
            label_strings:[],
            data_stock:[],
        })
        this.orm = useService("orm")
        this.actionService = useService("action")
        onWillStart(async ()=>{
            this.getProductCategories()
        })
    }

    async onChangeCategory(){
        this.getCategory()
        this.getDates()
        await this.getIncoming()
        await this.getOutgoing()
        await this.getStockQuantity()
    }

    async onChangePeriod(){
        const isCategory = this.getCategory()
        if (isCategory == false){
            return
        }
        this.getDates()
        await this.getIncoming()
        await this.getOutgoing()
        await this.getStockQuantity()
    }

    async getStockQuantity(){
        const products = await this.getProductFromCategory(parseInt(this.state.currentCategory))
        console.log("Products: " + products)
        const dateTimes = this.state.labels
        const productStockDatas = []
        for (let i = 0; i < products.length; i++) {
            let productStockData = {
                label: products[i].name,
                data: [],
                hoverOffset: 4
            }
            for (let j = 0; j < dateTimes.length; j++){
                let productStockQty = await this.getStockQuantityAtTime(products[i].id, dateTimes[j])
                productStockData.data.push(productStockQty)
            }
            productStockDatas.push(productStockData)
        }
        this.state.data_stock = productStockDatas
        console.log("Data Stock: " + this.state.data_stock)
    }

    async getStockQuantityAtTime(productId, dateTime){
        try {
            const stockQuantity = await this.orm.call("product.product", "get_stock_at_time", [productId, dateTime]);
            console.log("Stock Quantity:", stockQuantity);
            return stockQuantity;
        } catch (error) {
            console.error("Error fetching stock quantity:", error);
        }
    }

    getDates() {
        const currentDate = new Date();
        const previousDate = new Date();
    
        // Subtract the specified period from the current date
        currentDate.setDate(currentDate.getDate() - this.state.period);
        previousDate.setDate(previousDate.getDate() - this.state.period * 2);
    
        this.state.current_date = this.formatDate(currentDate);
        this.state.previous_date = this.formatDate(previousDate);

        if (this.state.currentCategory == 0){
            return
        }

        this.getChartDates()

    }

    formatDate(date){
        return date.toISOString().split('T')[0];
    }

    getChartDates(){
        // Generate labels based on the selected period
        const generateLabels = (startDate, interval, steps) => {
            const labels = [];
            const date = new Date(startDate);

            for (let i = 0; i <= steps; i++) {
                labels.push(this.formatDate(date)); 
                date.setDate(date.getDate() - interval);
            }

            return labels.reverse();
        };

        // Determine intervals and steps based on the selected period
        let interval, steps;
        switch (this.state.period) {
            case "7": // Last 7 Days
                interval = 1;
                steps = 6;
                break;
            case "30": // Last 1 Month
                interval = 6; 
                steps = 5;
                break;
            case "90": // Last 3 Months
                interval = 18; 
                steps = 5;
                break;
            case "365": // Last Year
                interval = 72; 
                steps = 5; 
                break;
            default:
                interval = 1;
                steps = 0;
        }
        const today = new Date();
        this.state.labels = generateLabels(today, interval, steps);
        this.state.label_strings = this.state.labels.map((label) => label.toString());

    }
    
    getCategory(){
        this.state.currentCategory = this.state.selectedProductCategory
        if (this.state.currentCategory == 0 || this.state.currentCategory == null){
            return false
        }
        return true
    }

    async getProductCategories(){
        try {
            const fields = ["id", "name"];
            const domain = [];
            const product_categories = await this.orm.searchRead("product.category", domain, fields);

            this.state.product_categories = product_categories.map((category) => ({
                value: category.id,
                label: category.name,
                product: category.product_id,
            }));
        } catch (error) {
            console.error("Failed to fetch Product Categories:", error);
        }
    }

    async getProducts() {
        try {
            const fields = ["id", "name"];
            let domain = [];
            const products = await this.orm.searchRead("product.product", domain, fields);

            this.state.products = products.map((product) => ({
                value: product.id,
                label: product.name,
            }));
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    }

    async getIncoming(){
        const incoming_picking_types = await this.orm.searchRead("stock.picking.type", [['code','=','incoming']])
        const incoming_ids = incoming_picking_types.map((incoming) => (incoming.id))
        let domain = [['state', 'in', ['done']], ['picking_type_id', 'in', incoming_ids]]

        if (this.state.period > 0){
            domain.push(['date_done','>=', this.state.current_date])
        }

        const stock_moves = await this.getStockMoves(domain)
        const qty_dones = stock_moves.map((stock_move) => (stock_move.quantity))
        const totalQtyDone = qty_dones.reduce((sum, qty) => sum + qty, 0);
        
        this.state.incoming_picking.value = totalQtyDone

        // previous period
        let prev_domain = [['state', 'in', ['done']], ['picking_type_id', 'in', incoming_ids]]
        if (this.state.period > 0){
            prev_domain.push(['date_done','>', this.state.previous_date], ['date_done','<=', this.state.current_date])
        }
        const prev_stock_moves = await this.getStockMoves(prev_domain)
        if (prev_stock_moves.length <= 0){
            this.state.incoming_picking.percentage = 100
            return
        }
        const prev_qty_dones = prev_stock_moves.map((stock_move) => (stock_move.quantity))
        if (prev_qty_dones.length <= 0){
            this.state.incoming_picking.percentage = 100
            return
        }
        const prev_totalQtyDone = prev_qty_dones.reduce((sum, qty) => sum + qty, 0);
        if (prev_totalQtyDone.length <= 0){
            this.state.incoming_picking.percentage = 100
            return
        }
        const percentage = ((totalQtyDone - prev_totalQtyDone)/prev_totalQtyDone) * 100
        this.state.incoming_picking.percentage = percentage.toFixed(2)

    }

    async getOutgoing(){
        const outgoing_picking_types = await this.orm.searchRead("stock.picking.type", [['code','=','outgoing']])
        const outgoing_ids = outgoing_picking_types.map((outgoing) => (outgoing.id))
        let domain = [['state', 'in', ['done']], ['picking_type_id', 'in', outgoing_ids]]

        if (this.state.period > 0){
            domain.push(['date_done','>=', this.state.current_date])
        }

        const stock_moves = await this.getStockMoves(domain)
        const qty_dones = stock_moves.map((stock_move) => (stock_move.quantity))
        const totalQtyDone = qty_dones.reduce((sum, qty) => sum + qty, 0);
        
        this.state.outgoing_picking.value = totalQtyDone

        // previous period
        let prev_domain = [['state', 'in', ['done']], ['picking_type_id', 'in', outgoing_ids]]
        if (this.state.period > 0){
            prev_domain.push(['date_done','>', this.state.previous_date], ['date_done','<=', this.state.current_date])
        }
        const prev_stock_moves = await this.getStockMoves(prev_domain)
        if (prev_stock_moves.length <= 0){
            this.state.outgoing_picking.percentage = 100
            return
        }
        const prev_qty_dones = prev_stock_moves.map((stock_move) => (stock_move.quantity))
        if (prev_qty_dones.length <= 0){
            this.state.outgoing_picking.percentage = 100
            return
        }
        const prev_totalQtyDone = prev_qty_dones.reduce((sum, qty) => sum + qty, 0);
        if (prev_totalQtyDone.length <= 0){
            this.state.outgoing_picking.percentage = 100
            return
        }
        const percentage = ((totalQtyDone - prev_totalQtyDone)/prev_totalQtyDone) * 100
        this.state.outgoing_picking.percentage = percentage.toFixed(2)

    }

    async getProductFromCategory(category){
        const products = await this.orm.searchRead("product.product", [['categ_id','child_of',category]])
        if (products.length <= 0 || products == null){
            return []
        }
        return products
    }

    async getStockMoves(domain){
        let stock_moves = []
        const pickings = await this.orm.searchRead("stock.picking", domain)
        const picking_ids = pickings.map((picking) => (picking.id))

        let product_ids = []
        
        if (this.state.currentCategory != 0){
            let products = []
            products = await this.getProductFromCategory(parseInt(this.state.currentCategory))
            product_ids = products.map((product) => (product.id))
        }

        stock_moves = await this.orm.searchRead("stock.move", [['picking_id','in',picking_ids], ['product_id','in',product_ids]])
        return stock_moves
    }

}

OwlInventoryDashboard.template = "owl.OwlInventoryDashboard"
OwlInventoryDashboard.components = { StockCard, ChartRenderer }

registry.category("actions").add("owl.inventory_dashboard", OwlInventoryDashboard)
