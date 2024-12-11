import { registry } from "@web/core/registry"
const { Component, onWillStart, useRef, onMounted, useState} = owl
import { StockCard } from "./stock_card/stock_card"
import { useService } from "@web/core/utils/hooks"
import { ChartRenderer } from "./chart_renderer/chart_renderer"


export class OwlInventoryDashboard extends Component {
    setup(){
        this.state = useState({
            quotations: {
                value:10,
                percentage:6,
            },
            period:90,
        })
        this.orm = useService("orm")
        this.actionService = useService("action")
        this.state.products = []
        onWillStart(async ()=>{
            this.getProducts()
        })
    }

    async getProducts() {
        try {
            const fields = ["id", "name"];
            const domain = [];
            const products = await this.orm.searchRead("product.product", domain, fields);

            this.state.products = products.map((product) => ({
                value: product.id,
                label: product.name,
            }));
        } catch (error) {
            console.error("Failed to fetch products:", error);
        }
    }

}

OwlInventoryDashboard.template = "owl.OwlInventoryDashboard"
OwlInventoryDashboard.components = { StockCard, ChartRenderer }

registry.category("actions").add("owl.inventory_dashboard", OwlInventoryDashboard)
