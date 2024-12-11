# -*- coding: utf-8 -*-
{
    'name': "Inventory Dashboard",

    'summary': "Inventory Dashboard",

    'description': """
        Inventory Dashboard Experiment
    """,

    'author': "Navios Solusindo",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'OWL',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'stock'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        # 'views/views.xml',
        # 'views/templates.xml',
        'views/inventory_dashboard.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'installable': True,
    'application': True,
    'assets': {
        'web.assets_backend': [
            'inventory_dashboard/static/src/components/**/*.js',
            'inventory_dashboard/static/src/components/**/*.xml',
            'inventory_dashboard/static/src/components/**/*.scss',
        ],
    },
}

