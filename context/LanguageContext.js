import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization"; // For getting device's locale

const LanguageContext = createContext();

const ASYNC_STORAGE_LANG_KEY = "userLanguage";

// --- Translation Data ---
const translations = {
  en: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Welcome to ", // Used with app_name for "Welcome to Hand Shop"

    // --- General ---
    hello_world: "Hello World!",
    welcome: "Welcome",
    login: "Login",
    username: "Username",
    password: "Password",
    submit: "Submit",
    logout: "Logout",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    save: "Save",
    add: "Add",
    select_language: "Select Language",
    ugandan_shillings: "Ugandan Shillings",
    confirm_delete: "Confirm Delete",
    confirm_delete_message:
      "Are you sure you want to delete this item? This action cannot be undone.",
    item_deleted: "Item deleted successfully!",
    error_deleting_item: "Failed to delete item. Please try again.",
    error_loading_inventory: "Failed to load inventory. Please try again.",
    clear_inventory_cancelled: "Clearing inventory cancelled.",
    inventory_cleared_success: "Inventory cleared successfully!",
    inventory_cleared_error: "Failed to clear inventory. Please try again.",
    save_failed: "Failed to save. Please try again.",
    save_success: "Saved successfully!",

    // --- Home Screen ---
    home_title: "Home",
    manage_inventory: "Manage Inventory",
    manage_float: "Manage Float",
    record_transactions: "Record Transactions",
    view_reports: "View Reports",
    settings: "Settings",
    is_mobile_money_agent: "Are you a Mobile Money Agent?",
    yes: "Yes",
    no: "No",
    agent_status_saved: "Agent status saved!",
    tip_home: "Tip: Swipe down to refresh the home screen data!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Inventory Management",
    mobile_money_float: "Mobile Money Float",
    item_name: "Item Name",
    close_business: "Close Business",
    current_stock: "Current Stock",
    cost_price: "Cost Price (UGX)",
    selling_price: "Selling Price (UGX)",
    item_total_cost_value: "Total Cost Value",
    item_total_selling_value: "Total Selling Value",
    inventory_value_cost: "Total Inventory Cost",
    inventory_value_sales: "Total Inventory Sales Value",
    clear_inventory_button: "Clear All Inventory",
    confirm_clear_inventory_title: "Confirm Clear Inventory",
    confirm_clear_inventory_message:
      "Are you sure you want to clear ALL inventory items? This action cannot be undone.",
    no_inventory_items: "No inventory items added yet.",

    // Agent Specific Inventory Labels
    network_name: "Network Name",
    current_float: "Current E-Value (Float)",
    initial_float_value: "Physical Cash Equivalent",
    fee_per_transaction: "Fee Per Transaction (UGX)",
    network_cash_equivalent: "Network Cash Equivalent",
    network_e_value_equivalent: "Network E-Value Balance",
    total_physical_cash: "Total Physical Cash",
    total_e_value_float: "Total E-Value Float",
    clear_float_history: "Clear Float History",
    no_networks_added: "No Mobile Money Networks Added Yet.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Add New Item",
    edit_item_title: "Edit Item",
    manage_item_title: "Manage Item", // Added for generic header in App.js
    add_new_item_title: "Add New Item", // Added for specific header in App.js
    item_name_placeholder: "e.g., Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "e.g., 50, 1000000",
    cost_price_placeholder: "e.g., 1500, 990",
    selling_price_placeholder: "e.g., 2000, 1000",
    stock_quantity: "Stock Quantity",
    float_amount: "Float Amount",
    cost_value: "Cost Value",
    selling_value: "Selling Value",
    item_saved_success: "Item saved successfully!",
    total_physical_cash: "Total Physical Cash",
    total_e_value_float: "Total E-Value Float",
    no_e_value_float_entries:
      "No E-Value float entries found. Click '+' to add mobile money floats.",
    add_e_value_float_entry: "Add E-Value Float Entry",
    edit_e_value_float_entry: "Edit E-Value Float Entry",
    add_new_e_value_float_entry: "Add New E-Value Float Entry",
    e_value_float_updated_success: "E-Value float updated successfully!",
    e_value_float_added_success: "E-Value float added successfully!",
    e_value_float_deleted_success: "E-Value float deleted successfully!",
    error_saving_e_value_float_entry: "Error saving E-Value float entry.",
    error_deleting_e_value_float_entry: "Error deleting E-Value float entry.",
    physical_cash_zero_title: "Your Physical Cash is Zero!",
    physical_cash_zero_message: "Please enter your current total cash at hand.",
    update_physical_cash: "Update Physical Cash",
    physical_cash_explanation:
      "Enter your total physical cash at hand. This is separate from mobile money balances.",
    physical_cash_amount: "Physical Cash Amount (UGX)",
    enter_cash_amount: "e.g., 500000",
    valid_cash_amount_required: "Please enter a valid positive cash amount.",
    physical_cash_updated_success: "Physical cash updated successfully!",
    error_saving_physical_cash: "Error saving physical cash.",
    please_enter_physical_cash_to_proceed:
      "Please enter your physical cash amount to proceed.",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Record Transaction", // Added for generic header in App.js
    transactions_title: "Record Transactions",
    select_transaction_type: "Select Transaction Type",
    sales: "Sales",
    expense: "Expense",
    mobile_money_deposit: "Mobile Money Deposit",
    mobile_money_withdrawal: "Mobile Money Withdrawal",
    record_sale: "Record Sale", // Specific button text
    record_restock: "Record Restock", // Specific button text
    record_withdrawal: "Record Withdrawal", // Specific button text
    record_deposit: "Record Deposit", // Specific button text
    transaction_type: "Transaction Type",
    amount: "Amount (UGX)",
    description: "Description",
    date: "Date",
    time: "Time",
    record: "Record",
    record_a_sale: "Record a Sale",
    record_a_restock: "Record a Restock",
    transaction_recorded_success: "Transaction recorded successfully!",
    error_recording_transaction:
      "Error recording transaction. Please try again.",
    select_item: "Select Item",
    quantity_sold: "Quantity Sold",
    price_per_unit: "Price Per Unit (UGX)",
    total_amount: "Total Amount",
    category: "Category",
    select_category: "Select Category",
    select_item_first: "Please select an item first.",
    cost_per_unit: "Cost Per Unit (UGX)",
    item: "Item",
    cash_in: "Cash In",
    cash_out: "Cash Out",
    fee: "Fee",
    network: "Network",
    select_network: "Select Network",
    phone_number: "Phone Number",
    transaction_id: "Transaction ID",
    customer_name: "Customer Name (Optional)",
    transaction_details: "Transaction Details",
    tip_transaction: "Press the microphone 🎤 icon to say the item",
    insufficient_stock: "Insufficient stock for this item.",
    insufficient_float: "Insufficient float for this network.",
    update_item_stock_error: "Error updating item stock.",
    update_float_error: "Error updating float.",
    record_sale: "Record Sale",
    record_restock: "Record Restock",
    record_withdrawal: "Record Withdrawal",
    record_deposit: "Record Deposit",
    network_name_required: "Network name is required.",
    valid_amount_required: "Please enter a valid amount.",
    customer_id_required_for_withdrawal:
      "Customer identifier (phone/name) is required for withdrawals.",
    transaction_recorded: "Transaction recorded successfully!",
    error_submitting_transaction: "Error submitting transaction",
    item_not_in_inventory_warning: "Item not found in inventory.",
    consider_adding_item:
      "Consider adding this item to your general inventory.",
    float_not_updated_warning: "Float not updated.",
    consider_adding_float_entry: "Consider adding a float entry for {network}.",
    speak_now: "Speak now",
    listening: "Listening",
    listening_for_field: "Listening for {field}...", // New key
    networkName: "Network Name", // Used for the dynamic 'field' in listening_for_field
    transactionAmount: "Transaction Amount", // Used for the dynamic 'field'
    customerIdentifier: "Customer Identifier", // Used for the dynamic 'field'
    voice_recognition_error: "Voice Recognition Error",
    try_again_or_check_settings: "Please try again or check device settings.",
    voice_start_error: "Error starting voice input",
    check_mic_permissions: "Check microphone permissions.",
    invalid_amount_voice: "Invalid amount spoken", // New key
    please_speak_clearly:
      "Please speak clearly, e.g., 'five thousand' or '5000'.", // New key

    // --- Reports Screen ---
    reports_title: "Reports",
    generate_report: "Generate Report",
    start_date: "Start Date",
    end_date: "End Date",
    daily_report: "Daily Report",
    weekly_report: "Weekly Report",
    monthly_report: "Monthly Report",
    custom_range: "Custom Range",
    net_profit: "Net Profit",
    total_revenue: "Total Revenue",
    total_expenses: "Total Expenses",
    total_sales: "Total Sales",
    no_transactions_found: "No transactions found for the selected period.",
    total_deposits: "Total Deposits",
    total_withdrawals: "Total Withdrawals",
    total_float_change: "Total Float Change",
    profit_from_fees: "Profit From Fees",
    summary: "Summary",
    view_summary: "View Summary",
    daily_summary_title: "Daily Summary", // Added for generic header in App.js
    detailed_transactions: "Detailed Transactions",
    print_report: "Print Report",
    share_report: "Share Report",

    // --- History Screen ---
    transaction_history_title: "Transaction History", // Added for generic header in App.js
    view_history: "View History",
    history_title: "Transaction History", // Used for the History screen
    withdrew_amount: "Withdrew Amount",
    deposited_amount: "Deposited Amount",
    sold_quantity: "Sold Quantity",
    restocked_quantity: "Restocked Quantity",
    network: "Network",
    item: "Item",
    withdrawal_amount: "Withdrawal Amount",
    deposit_amount: "Deposit Amount",
    total_price: "Total Price",
    commission_earned: "Commission Earned",
    units: "units", // Added for clarity with shop items

    // --- Settings Screen ---
    language_settings: "Language Settings",
    app_settings: "App Settings",
    change_language: "Change Language",
    set_agent_status: "Set Mobile Money Agent Status",
    confirm_agent_status_change_title: "Confirm Agent Status Change",
    confirm_agent_status_change_message:
      "Changing this will alter how inventory and transactions are displayed and calculated. Are you sure you want to proceed?",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  lg: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Tukwanirizza mu ",

    // --- General ---
    hello_world: "Mwasuze Mutya!",
    welcome: "Tukwanirizza",
    login: "Yingira",
    username: "Erinnya Ly'omukozesa",
    password: "Ekikoodi",
    submit: "Tuma",
    logout: "Fulumwa",
    cancel: "Sazaamu",
    delete: "Sazaamu",
    edit: "Kyuusa",
    save: "Terera",
    add: "Gattaako",
    select_language: "Londa Olulimi",
    ugandan_shillings: "Amashilingi ga Uganda",
    confirm_delete: "Kakasa Okusazaamu",
    confirm_delete_message:
      "Oli mukakasa okusazaamu ekintu kino? Kino tekiyinza kuddibwamu.",
    item_deleted: "Ekintu kisaziddwaamu bulungi!",
    error_deleting_item: "Okusazaamu ekintu kwagaana. Gerageza nate.",
    error_loading_inventory: "Okulonda eby'amaguzi kwagaana. Gerageza nate.",
    clear_inventory_cancelled: "Okusazaamu eby'amaguzi kusaziddwaamu.",
    inventory_cleared_success: "Eby'amaguzi bisaziddwaamu bulungi!",
    inventory_cleared_error: "Okusazaamu eby'amaguzi kwagaana. Gerageza nate.",
    save_failed: "Okuterera kwagaana. Gerageza nate.",
    save_success: "Kitereddwa bulungi!",

    // --- Home Screen ---
    home_title: "Awaka",
    manage_inventory: "Kola ku Byamaguzi",
    manage_float: "Kola ku Float",
    record_transactions: "Wandiika Enkola",
    view_reports: "Laba Lipooti",
    view_summary: "Laba Summary",
    settings: "Ebirongoozebwa",
    is_mobile_money_agent: "Oli Mobile Money Agent?",
    yes: "Yee",
    no: "Nedda",
    agent_status_saved: "Enkola y'omukozi etereddwa!",
    tip_home: "Akabonero: Senya wansi okuddamu okulaba eby'awaka!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Enkola y'Ebyamaguzi",
    mobile_money_float: "Eya Mobile Money Float",
    item_name: "Erinnya ly'Ekintu",
    current_stock: "Ebyamaguzi Ebiriwo Kati",
    cost_price: "Omuwendo Gwe Kikoleddwako (UGX)",
    selling_price: "Omuwendo Gwe Kitundibwako (UGX)",
    item_total_cost_value: "Omuwendo Gwonna Ogwe Kikoleddwako",
    item_total_selling_value: "Omuwendo Gwonna Ogwe Kitundibwako",
    inventory_value_cost: "Omutindo Gw'ebintu Byonna",
    inventory_value_sales: "Omutindo Gw'ebintu Byonna Ebyatundibwa",
    clear_inventory_button: "Sazaamu Ebyamaguzi Byonna",
    confirm_clear_inventory_title: "Kakasa Okusazaamu Ebyamaguzi",
    confirm_clear_inventory_message:
      "Oli mukakasa okusazaamu ebintu BYONNA mu byamaguzi? Kino tekiyinza kuddibwamu.",
    no_inventory_items: "Tewali bintu byamaguzi bigattiddwako.",

    // Agent Specific Inventory Labels
    network_name: "Erinnya lya Network",
    current_float: "Eya E-Value (Float) Eriwo Kati",
    initial_float_value: "Ensimbi Ezikwata Float",
    fee_per_transaction: "Fee Ku Kweereza Kwonna (UGX)",
    network_cash_equivalent: "Ensimbi Ezikwata Network",
    network_e_value_equivalent: "Eya Network E-Value Eriwo",
    total_physical_cash: "Ensimbi Zonna Eziriwo",
    total_e_value_float: "Eya E-Value Float Yonna",
    clear_float_history: "Sazaamu Ebyayita mu Float",
    no_networks_added: "Tewali Mobile Money Network Eggattiddwaako.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Gattaako Ekintu Ekipya",
    edit_item_title: "Kyuusa Ekintu",
    manage_item_title: "Kola ku Kintu",
    add_new_item_title: "Gattaako Ekintu Ekipya",
    item_name_placeholder: "Ekyokulabirako: Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "Ekyokulabirako: 50, 1000000",
    cost_price_placeholder: "Ekyokulabirako: 1500, 990",
    selling_price_placeholder: "Ekyokulabirako: 2000, 1000",
    stock_quantity: "Obungi Bw'eby'amaguzi",
    float_amount: "Obungi Bwa Float",
    cost_value: "Omuwendo Gwe Kikoleddwako",
    selling_value: "Omuwendo Gwe Kitundibwako",
    item_saved_success: "Ekintu kitereddwa bulungi!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Wandiika Enkola",
    transactions_title: "Wandiika Enkola",
    select_transaction_type: "Londa Ekika Ky'enkola",
    sales: "Ebyatundibwa",
    expense: "Ebyafulumye",
    mobile_money_deposit: "Mobile Money Okuteekawo",
    mobile_money_withdrawal: "Mobile Money Okuggyako",
    record_sale: "Wandiika Ekyatundibwa",
    record_restock: "Wandiika Ekyagattibwa",
    record_withdrawal: "Wandiika Okuggyako",
    record_deposit: "Wandiika Okuteekawo",
    transaction_type: "Ekika Ky'enkola",
    amount: "Omuwendo (UGX)",
    description: "Ebikwata ku Nkola",
    date: "Olunaku",
    time: "Akafo",
    record: "Wandiika",
    transaction_recorded_success: "Enkola ewandikiddwa bulungi!",
    error_recording_transaction:
      "Wabaddewo ensobi mu kuwandika enkola. Gerageza nate.",
    select_item: "Londa Ekintu",
    quantity_sold: "Obungi Obwatundibwa",
    price_per_unit: "Omuwendo Ku Kintu Kimu (UGX)",
    total_amount: "Omuwendo Gwonna",
    category: "Ekika",
    select_category: "Londa Ekika",
    select_item_first: "Londa ekintu kimu olubereberye.",
    cost_per_unit: "Omuwendo ku Ka Unit (UGX)",
    item: "Ekintu",
    cash_in: "Ensimbi Ziyingidde",
    cash_out: "Ensimbi Zafulumye",
    fee: "Fee",
    network: "Network",
    select_network: "Londa Network",
    phone_number: "Ekimu kya Ssimu",
    transaction_id: "Namba y'Enkola",
    customer_name: "Erinnya Ly'ogula (Optional)",
    transaction_details: "Ebikwata ku Nkola",
    insufficient_stock: "Ebyamaguzi tebimala ku kintu kino.",
    insufficient_float: "Eya float tennamala ku network eno.",
    update_item_stock_error: "Wabaddewo ensobi mu kuteekawo ebyamaguzi.",
    update_float_error: "Wabaddewo ensobi mu kuteekawo float.",
    speak_now: "Vuga kaakano",
    listening: "Nkuwulira",
    listening_for_field: "Nkuwulira {field}...", // New key
    networkName: "Erinnya lya Network", // Used for the dynamic 'field'
    transactionAmount: "Omuwendo gw'Enkola", // Used for the dynamic 'field'
    customerIdentifier: "Erinnya/Namba ya Kasitoma", // Used for the dynamic 'field'
    voice_recognition_error: "Waliwo Ekikyamu Mu Kuwulira Ekigambo",
    try_again_or_check_settings:
      "Geraako omulala oba kola ku setingi za telefone.",
    voice_start_error: "Waliwo ekikyamu mu kutandika okuwulira",
    check_mic_permissions: "Kola ku lusa lwa microphone.",
    invalid_amount_voice: "Omuwendo teguwuliddwa bulungi", // New key
    please_speak_clearly:
      "Mwattu vuga bulungi, gamba, 'mitwalo etaano' oba '5000'.", // New key

    // --- Reports Screen ---
    reports_title: "Lipooti",
    generate_report: "Kola Lipooti",
    start_date: "Olunaku Olusooka",
    end_date: "Olunaku Olukomekkerezo",
    daily_report: "Lipooti ya Buli Lunaku",
    weekly_report: "Lipooti ya Buli Wiki",
    monthly_report: "Lipooti ya Buli Mwezi",
    custom_range: "Ekkomo Eryo Ggyegyo",
    net_profit: "Amagoba Amayonjo",
    total_revenue: "Omugatte Gw'ensimbi Ezayingira",
    total_expenses: "Omugatte Gw'ebyavaamu",
    total_sales: "Omugatte Gw'ebyatundibwa",
    no_transactions_found:
      "Tewali nkola ezisangiddwa mu biseera ebyo ebyalondeddwamu.",
    total_deposits: "Omugatte Gw'ebiteekeddwawo",
    total_withdrawals: "Omugatte Gw'ebiggyiddwako",
    total_float_change: "Okukyuka Kwonna Okwa Float",
    profit_from_fees: "Amagoba Ga Fees",
    summary: "Omukwano Omupya",
    view_summary: "Laba Samare",
    daily_summary_title: "Omukwano Ogwa Buli Lunaku",
    detailed_transactions: "Enkola Mu Bubu",
    print_report: "Kuba Lipooti",
    share_report: "Gaba Lipooti",

    // --- History Screen ---
    transaction_history_title: "Ebyafaayo by'Enkola",
    view_history: "Laba Ebyafaayo",
    history_title: "Ebyafaayo by'Enkola",

    // --- Settings Screen ---
    language_settings: "Ebirongoozebwa by'Olulimi",
    app_settings: "Ebirongoozebwa bya App",
    change_language: "Kyuusa Olulimi",
    set_agent_status: "Teekawo Ekifo ky'Omukulembeze wa Mobile Money",
    confirm_agent_status_change_title: "Kakasa Okukyusa Ekifo ky'Omukulembeze",
    confirm_agent_status_change_message:
      "Okukyusa kino kyakyuusa engeri eby'amaguzi n'enkola gye biragibwamu era gye bibalibwamu. Oli mukakasa okugenda mu maaso?",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  sw: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Karibu ",

    // --- General ---
    hello_world: "Habari Dunia!",
    welcome: "Karibu",
    login: "Ingia",
    username: "Jina la Mtumiaji",
    password: "Neno la Siri",
    submit: "Wasilisha",
    logout: "Toka",
    cancel: "Ghairi",
    delete: "Futa",
    edit: "Hariri",
    save: "Hifadhi",
    add: "Ongeza",
    select_language: "Chagua Lugha",
    ugandan_shillings: "Shilingi za Uganda",
    confirm_delete: "Thibitisha Kufuta",
    confirm_delete_message:
      "Una uhakika unataka kufuta bidhaa hii? Kitendo hiki hakiwezi kutenduliwa.",
    item_deleted: "Bidhaa imefutwa kwa mafanikio!",
    error_deleting_item: "Imeshindwa kufuta bidhaa. Tafadhali jaribu tena.",
    error_loading_inventory:
      "Imeshindwa kupakia orodha. Tafadhali jaribu tena.",
    clear_inventory_cancelled: "Kufuta orodha kumeghairiwa.",
    inventory_cleared_success: "Orodha imefutwa kwa mafanikio!",
    inventory_cleared_error: "Imeshindwa kufuta orodha. Tafadhali jaribu tena.",
    save_failed: "Imeshindwa kuhifadhi. Tafadhali jaribu tena.",
    save_success: "Imehifadhiwa kwa mafanikio!",

    // --- Home Screen ---
    home_title: "Nyumbani",
    manage_inventory: "Dhibiti Orodha",
    manage_float: "Dhibiti Float",
    record_transactions: "Andika Miamala",
    view_reports: "Angalia Ripoti",
    settings: "Mipangilio",
    is_mobile_money_agent: "Wewe ni Wakala wa Simu?",
    yes: "Ndio",
    no: "Hapana",
    agent_status_saved: "Hali ya wakala imehifadhiwa!",
    tip_home:
      "Dokezo: Telezesha chini ili kuonyesha upya data ya skrini ya nyumbani!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Usimamizi wa Orodha",
    mobile_money_float: "Float ya Simu",
    item_name: "Jina la Bidhaa",
    current_stock: "Akiba Iliyopo",
    cost_price: "Bei ya Gharama (UGX)",
    selling_price: "Bei ya Kuuza (UGX)",
    item_total_cost_value: "Jumla ya Gharama",
    item_total_selling_value: "Jumla ya Thamani ya Mauzo",
    inventory_value_cost: "Jumla ya Gharama ya Orodha",
    inventory_value_sales: "Jumla ya Thamani ya Mauzo ya Orodha",
    clear_inventory_button: "Futa Orodha Yote",
    confirm_clear_inventory_title: "Thibitisha Kufuta Orodha",
    confirm_clear_inventory_message:
      "Una uhakika unataka kufuta bidhaa ZOTE za orodha? Kitendo hiki hakiwezi kutenduliwa.",
    no_inventory_items: "Hakuna bidhaa za orodha zilizoongezwa bado.",

    // Agent Specific Inventory Labels
    network_name: "Jina la Mtandao",
    current_float: "E-Value Iliyopo (Float)",
    initial_float_value: "Thamani ya Fedha Halisi",
    fee_per_transaction: "Ada kwa Kila Muamala (UGX)",
    network_cash_equivalent: "Usawa wa Fedha wa Mtandao",
    network_e_value_equivalent: "Salio la E-Value la Mtandao",
    total_physical_cash: "Jumla ya Fedha Halisi",
    total_e_value_float: "Jumla ya E-Value (Float)",
    clear_float_history: "Futa Historia ya Float",
    no_networks_added: "Hakuna Mitandao ya Simu Imeongezwa Bado.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Ongeza Bidhaa Mpya",
    edit_item_title: "Hariri Bidhaa",
    manage_item_title: "Dhibiti Bidhaa",
    add_new_item_title: "Ongeza Bidhaa Mpya",
    item_name_placeholder: "k.m., Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "k.m., 50, 1000000",
    cost_price_placeholder: "k.m., 1500, 990",
    selling_price_placeholder: "k.m., 2000, 1000",
    stock_quantity: "Kiasi cha Akiba",
    float_amount: "Kiasi cha Float",
    cost_value: "Thamani ya Gharama",
    selling_value: "Thamani ya Mauzo",
    item_saved_success: "Bidhaa imehifadhiwa kwa mafanikio!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Andika Muamala",
    transactions_title: "Andika Miamala",
    select_transaction_type: "Chagua Aina ya Muamala",
    sales: "Mauzo",
    expense: "Gharama",
    mobile_money_deposit: "Amana ya Simu",
    mobile_money_withdrawal: "Utoaji wa Simu",
    record_sale: "Andika Mauzo",
    record_restock: "Andika Ujazaji",
    record_withdrawal: "Andika Utoaji",
    record_deposit: "Andika Amana",
    transaction_type: "Aina ya Muamala",
    amount: "Kiasi (UGX)",
    description: "Maelezo",
    date: "Tarehe",
    time: "Muda",
    record: "Andika",
    transaction_recorded_success: "Muamala umerekodiwa kwa mafanikio!",
    error_recording_transaction:
      "Hitilafu wakati wa kurekodi muamala. Tafadhali jaribu tena.",
    select_item: "Chagua Bidhaa",
    quantity_sold: "Kiasi Kilichouzwa",
    price_per_unit: "Bei kwa Kitengo (UGX)",
    total_amount: "Jumla ya Kiasi",
    category: "Jamii",
    select_category: "Chagua Jamii",
    select_item_first: "Tafadhali chagua bidhaa kwanza.",
    cost_per_unit: "Gharama Kwa Kitengo (UGX)",
    item: "Bidhaa",
    cash_in: "Fedha Ndani",
    cash_out: "Fedha Nje",
    fee: "Ada",
    network: "Mtandao",
    select_network: "Chagua Mtandao",
    phone_number: "Namba ya Simu",
    transaction_id: "Kitambulisho cha Muamala",
    customer_name: "Jina la Mteja (Hiari)",
    transaction_details: "Maelezo ya Muamala",
    insufficient_stock: "Akiba haitoshi kwa bidhaa hii.",
    insufficient_float: "Float haitoshi kwa mtandao huu.",
    update_item_stock_error: "Hitilafu wakati wa kusasisha akiba ya bidhaa.",
    update_float_error: "Hitilafu wakati wa kusasisha float.",

    // --- Reports Screen ---
    reports_title: "Ripoti",
    generate_report: "Tengeneza Ripoti",
    start_date: "Tarehe ya Kuanza",
    end_date: "Tarehe ya Mwisho",
    daily_report: "Ripoti ya Kila Siku",
    weekly_report: "Ripoti ya Kila Wiki",
    monthly_report: "Ripoti ya Kila Mwezi",
    custom_range: "Kipindi Maalum",
    net_profit: "Faida Halisi",
    total_revenue: "Jumla ya Mapato",
    total_expenses: "Jumla ya Matumizi",
    total_sales: "Jumla ya Mauzo",
    no_transactions_found:
      "Hakuna miamala iliyopatikana kwa kipindi kilichochaguliwa.",
    total_deposits: "Jumla ya Amana",
    total_withdrawals: "Jumla ya Utoaji",
    total_float_change: "Jumla ya Mabadiliko ya Float",
    profit_from_fees: "Faida Kutokana na Ada",
    summary: "Muhtasari",
    view_summary: "To Translate",
    daily_summary_title: "Muhtasari wa Kila Siku",
    detailed_transactions: "Miamala Kina",
    print_report: "Chapisha Ripoti",
    share_report: "Shiriki Ripoti",

    // --- History Screen ---
    transaction_history_title: "Historia ya Muamala",
    view_history: "Angalia Historia",
    history_title: "Historia ya Muamala",

    // --- Settings Screen ---
    language_settings: "Mipangilio ya Lugha",
    app_settings: "Mipangilio ya Programu",
    change_language: "Badilisha Lugha",
    set_agent_status: "Weka Hali ya Wakala wa Simu",
    confirm_agent_status_change_title:
      "Thibitisha Mabadiliko ya Hali ya Wakala",
    confirm_agent_status_change_message:
      "Kubadilisha hii kutabadilisha jinsi orodha na miamala inavyoonyeshwa na kuhesabiwa. Una uhakika unataka kuendelea?",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  nyn: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Mwahurire kuri ",

    // --- General ---
    hello_world: "Oraire Gye!",
    welcome: "Mwahurire",
    login: "Taaha",
    username: "Eryooba ry'Omukozesa",
    password: "Ekiroore",
    submit: "Oteeraho",
    logout: "Gaani",
    cancel: "Gara",
    delete: "Siiga",
    edit: "Himba",
    save: "Hoorra",
    add: "Yongyera",
    select_language: "Torana Orurimi",
    ugandan_shillings: "Amashiringi ga Uganda",
    confirm_delete: "Kakasa Okusiiga",
    confirm_delete_message:
      "Oli mukakasa okusiiga ekintu eki? Kino tikyasaasirwa.",
    item_deleted: "Ekintu kisiigirwe gye!",
    error_deleting_item: "Okusiiga ekintu kwagaana. Gerageza nate.",
    error_loading_inventory: "Okureetaho eby'amaguzi kwagaana. Gerageza nate.",
    clear_inventory_cancelled: "Okusiiga eby'amaguzi kwagarwe.",
    inventory_cleared_success: "Eby'amaguzi bisiigirwe gye!",
    inventory_cleared_error: "Okusiiga eby'amaguzi kwagaana. Gerageza nate.",
    save_failed: "Okuhurra kwagaana. Gerageza nate.",
    save_success: "Kihoorirwe gye!",

    // --- Home Screen ---
    home_title: "Akafu",
    manage_inventory: "Gye Byamaguzi",
    manage_float: "Gye Float",
    record_transactions: "Andiika Ebikorwa",
    view_reports: "Reeba Ripooti",
    settings: "Ebihimbirwe",
    is_mobile_money_agent: "Oli Mobile Money Agent?",
    yes: "Yego",
    no: "Nka",
    agent_status_saved: "Hali y'agent ehoorirwe!",
    tip_home: "Akakagiro: Senya ahansi kurora amakuru g'akaafu gataheya!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Okugyendera Eby'amaguzi",
    mobile_money_float: "Eya Mobile Money Float",
    item_name: "Eryooba ry'Ekintu",
    current_stock: "Eby'amaguzi Ebiriho",
    cost_price: "Ekiruga Kyoona (UGX)",
    selling_price: "Ekiruga Ky'okuguza (UGX)",
    item_total_cost_value: "Omuwendo Gw'ekintu Gwonna",
    item_total_selling_value: "Omuwendo Gw'ekintu Gwonna Ogw'okuguza",
    inventory_value_cost: "Omutindo Gw'eby'amaguzi Byoona",
    inventory_value_sales: "Omutindo Gw'eby'amaguzi Byoona Ebyaguzibwa",
    clear_inventory_button: "Siiga Eby'amaguzi Byoona",
    confirm_clear_inventory_title: "Kakasa Okusiiga Eby'amaguzi",
    confirm_clear_inventory_message:
      "Oli mukakasa okusiiga ebintu BYONNA mu by'amaguzi? Kino tikyasaasirwa.",
    no_inventory_items: "Tihariho bintu by'amaguzi ebyongyerweho.",

    // Agent Specific Inventory Labels
    network_name: "Eryooba rya Network",
    current_float: "Eya E-Value (Float) Eriho",
    initial_float_value: "Ensimbi Ezikwata Float",
    fee_per_transaction: "Fee Ku Bukorwa Bwoona (UGX)",
    network_cash_equivalent: "Ensimbi Ezikwata Network",
    network_e_value_equivalent: "Eya Network E-Value Eriho",
    total_physical_cash: "Ensimbi Zoona Eziriho",
    total_e_value_float: "Eya E-Value Float Yoona",
    clear_float_history: "Siiga Amakuru Ga Float",
    no_networks_added: "Tihariho Mobile Money Networks Ezyongyerweho.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Yongyera Ekintu Ekihya",
    edit_item_title: "Himba Ekintu",
    manage_item_title: "Gye Ekintu",
    add_new_item_title: "Yongyera Ekintu Ekihya",
    item_name_placeholder:
      "Nk'ekyokureeberaho: Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "Nk'ekyokureeberaho: 50, 1000000",
    cost_price_placeholder: "Nk'ekyokureeberaho: 1500, 990",
    selling_price_placeholder: "Nk'ekyokureeberaho: 2000, 1000",
    stock_quantity: "Obwingi bwa Stock",
    float_amount: "Obwingi bwa Float",
    cost_value: "Omuwendo Gw'ekiruga",
    selling_value: "Omuwendo Gw'okuguza",
    item_saved_success: "Ekintu kihoorirwe gye!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Andiika Ekikorwa",
    transactions_title: "Andiika Ebikorwa",
    select_transaction_type: "Haana Ekika Ky'ekikorwa",
    sales: "Ebyaguzibwa",
    expense: "Ebyo Kuza",
    mobile_money_deposit: "Mobile Money Okushashuura",
    mobile_money_withdrawal: "Mobile Money Okuruga",
    record_sale: "Andiika Ebyaguzibwa",
    record_restock: "Andiika Ebyongyerweho",
    record_withdrawal: "Andiika Okuruga",
    record_deposit: "Andiika Okushashuura",
    transaction_type: "Ekika Ky'ekikorwa",
    amount: "Omuwendo (UGX)",
    description: "Amakuru",
    date: "Eriizooba",
    time: "Obwiire",
    record: "Andiika",
    transaction_recorded_success: "Ekikorwa kyandikwa gye!",
    error_recording_transaction:
      "Wabaho akaseera kakabi okwandika ekikorwa. Gerageza nate.",
    select_item: "Haana Ekintu",
    quantity_sold: "Obwingi Obwaguza",
    price_per_unit: "Omuwendo Ku Ka Unit (UGX)",
    total_amount: "Omuwendo Gwonna",
    category: "Ekika",
    select_category: "Haana Ekika",
    select_item_first: "Tindyo haana ekintu kimu.",
    cost_per_unit: "Ekiruga Ku Ka Unit (UGX)",
    item: "Ekintu",
    cash_in: "Ensimbi ziyingire",
    cash_out: "Ensimbi zafulumye",
    fee: "Fee",
    network: "Network",
    select_network: "Haana Network",
    phone_number: "Ekimu kya Ssimu",
    transaction_id: "Namba y'ekikorwa",
    customer_name: "Eryooba ry'ogula (Optional)",
    transaction_details: "Amakuru G'ekikorwa",
    insufficient_stock: "Stock tinarikira ekintu eki.",
    insufficient_float: "Float tinarikira network egi.",
    update_item_stock_error: "Wabaho akaseera kakabi okuhimba stock y'ekintu.",
    update_float_error: "Wabaho akaseera kakabi okuhimba float.",

    // --- Reports Screen ---
    reports_title: "Ripooti",
    generate_report: "Kora Ripooti",
    start_date: "Eriizooba Ly'okubanza",
    end_date: "Eriizooba Ly'okumaliriraho",
    daily_report: "Ripooti ya Buli Iriizooba",
    weekly_report: "Ripooti ya Buli Wiki",
    monthly_report: "Ripooti ya Buli Mwezi",
    custom_range: "Ekiru Byoona",
    net_profit: "Amagoba Amaho",
    total_revenue: "Omuwendo Gw'ensimbi Zoonza",
    total_expenses: "Omuwendo Gw'ebyavaamu",
    total_sales: "Omuwendo Gw'ebyaguzibwa",
    no_transactions_found:
      "Tihariho bikorwa ebyasangirweho omu bweire obu bwahaanwa.",
    total_deposits: "Omuwendo Gw'ebiteekeddwa",
    total_withdrawals: "Omuwendo Gw'ebiggyiddwa",
    total_float_change: "Okukyuka Kwonna Okwa Float",
    profit_from_fees: "Amagoba Kuturuka Ha Fees",
    summary: "Omukwano Omupya",
    daily_summary_title: "Omukwano Gw'eriizooba",
    detailed_transactions: "Ebikorwa Mu Bubu",
    print_report: "Kuba Ripooti",
    share_report: "Gaba Ripooti",

    // --- History Screen ---
    transaction_history_title: "Amakuru G'ebikorwa",
    view_history: "Reeba Amakuru",
    history_title: "Amakuru G'ebikorwa",

    // --- Settings Screen ---
    language_settings: "Ebihimbirwe by'Orurimi",
    app_settings: "Ebihimbirwe bya App",
    change_language: "Kyuusa Orurimi",
    set_agent_status: "Teekawo Hali y'Omukulembeze wa Mobile Money",
    confirm_agent_status_change_title: "Kakasa Okukyusa Hali y'Omukulembeze",
    confirm_agent_status_change_message:
      "Okukyusa eki nikikyuusa oku by'amaguzi n'ebikorwa birikureebekwa n'okubalirwa. Oli mukakasa okugyenda omu maaso?",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  ach: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Amwonyo i ",

    // --- General ---
    hello_world: "Mabiyo!",
    welcome: "Amwonyo",
    login: "Donge iye",
    username: "Nyingi me dano",
    password: "Lok acana",
    submit: "Timo",
    logout: "Yweko",
    cancel: "Juki",
    delete: "Juko",
    edit: "Loko",
    save: "Miyo",
    add: "Medo",
    select_language: "Yero leb",
    ugandan_shillings: "Cilingi pa Uganda",
    confirm_delete: "Kwano Juko",
    confirm_delete_message:
      "Ikwano ni ijwero juko ginni? Tim maci pe twero lokke.",
    item_deleted: "Gin jukko maber!",
    error_deleting_item: "Pe otwero juko ginni. Tem doki.",
    error_loading_inventory: "Pe otwero laro gin-ni. Tem doki.",
    clear_inventory_cancelled: "Juko gin-ni ojuko.",
    inventory_cleared_success: "Gin-ni ojwenge jwi!",
    inventory_cleared_error: "Pe otwero jwengo gin-ni. Tem doki.",
    save_failed: "Pe otwero miyo. Tem doki.",
    save_success: "Omiyo maber!",

    // --- Home Screen ---
    home_title: "Gang",
    manage_inventory: "Timo Gin",
    manage_float: "Timo Float",
    record_transactions: "Kwano Tiro",
    view_reports: "Neno Ripoti",
    settings: "Kwano",
    is_mobile_money_agent: "In iling Mobile Money Agent?",
    yes: "Ee",
    no: "Pe",
    agent_status_saved: "Hali pa agent omiyo!",
    tip_home: "Akobota: Twero laro gang ki jwenge data!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Timo Gin",
    mobile_money_float: "Float pa Mobile Money",
    item_name: "Nyingi Gin",
    current_stock: "Gin Man Okato",
    cost_price: "Wel Gin (UGX)",
    selling_price: "Wel Gin ma twero gamo (UGX)",
    item_total_cost_value: "Wel Gin Man",
    item_total_selling_value: "Wel Gin ma Twero Gamo",
    inventory_value_cost: "Wel Gin Man Dwe",
    inventory_value_sales: "Wel Gin ma Twero Gamo Dwe",
    clear_inventory_button: "Juko Gin Man Dwe",
    confirm_clear_inventory_title: "Kwano Juko Gin",
    confirm_clear_inventory_message:
      "Ikwano ni ijwero juko gin DWE i gin-ni? Tim maci pe twero lokke.",
    no_inventory_items: "Pee gin mo i gin-ni matye kwede.",

    // Agent Specific Inventory Labels
    network_name: "Nyingi Network",
    current_float: "E-Value (Float) Ma Tye Kwede",
    initial_float_value: "Wel Gin Man Ma Kwede",
    fee_per_transaction: "Wel Kwede pa Tiro (UGX)",
    network_cash_equivalent: "Wel Gin Ma Tye Kwede i Network",
    network_e_value_equivalent: "Wel E-Value Ma Tye Kwede i Network",
    total_physical_cash: "Wel Gin Man Dwe",
    total_e_value_float: "Wel E-Value Float Dwe",
    clear_float_history: "Juko Tarac pa Float",
    no_networks_added: "Pee Mobile Money Networks Matye Kwede.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Medo Gin Nyen",
    edit_item_title: "Loko Gin",
    manage_item_title: "Timo Gin",
    add_new_item_title: "Medo Gin Nyen",
    item_name_placeholder: "k.m., Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "k.m., 50, 1000000",
    cost_price_placeholder: "k.m., 1500, 990",
    selling_price_placeholder: "k.m., 2000, 1000",
    stock_quantity: "Kaka Gin Man",
    float_amount: "Kaka Float",
    cost_value: "Wel Gin Man",
    selling_value: "Wel Gin ma Twero Gamo",
    item_saved_success: "Gin omiyo maber!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Kwano Tiro",
    transactions_title: "Kwano Tiro",
    select_transaction_type: "Yero Kaka Tiro",
    sales: "Gin ma Ogamo",
    expense: "Gin ma Olokko",
    mobile_money_deposit: "Mobile Money Ogamo",
    mobile_money_withdrawal: "Mobile Money Olokko",
    record_sale: "Kwano Ma Gamo",
    record_restock: "Kwano Medo",
    record_withdrawal: "Kwano Loko",
    record_deposit: "Kwano Gamo",
    transaction_type: "Kaka Tiro",
    amount: "Wel (UGX)",
    description: "Ngero",
    date: "Nino",
    time: "Cawa",
    record: "Kwano",
    transaction_recorded_success: "Tiro okwano maber!",
    error_recording_transaction: "Adwogi pa kwano tiro. Tem doki.",
    select_item: "Yero Gin",
    quantity_sold: "Kaka Gin ma Ogamo",
    price_per_unit: "Wel Kwede pa Tiro (UGX)",
    total_amount: "Wel Gin Dwe",
    category: "Kaka",
    select_category: "Yero Kaka",
    select_item_first: "Tem yero gin mukwongo.",
    cost_per_unit: "Wel Kwede pa Tiro (UGX)",
    item: "Gin",
    cash_in: "Cilingi Oloko",
    cash_out: "Cilingi Okato",
    fee: "Fee",
    network: "Network",
    select_network: "Yero Network",
    phone_number: "Namba pa Cawa",
    transaction_id: "Namba pa Tiro",
    customer_name: "Nyingi Laco (Optional)",
    transaction_details: "Amakuru Pa Tiro",
    insufficient_stock: "Gin man pe twero gamo kony.",
    insufficient_float: "Float pe twero gamo kony i network ni.",
    update_item_stock_error: "Adwogi pa loko stock pa gin.",
    update_float_error: "Adwogi pa loko float.",

    // --- Reports Screen ---
    reports_title: "Ripoti",
    generate_report: "Timo Ripoti",
    start_date: "Nino pa Cawa",
    end_date: "Nino pa Cawa Cawa",
    daily_report: "Ripoti pa Buli Nino",
    weekly_report: "Ripoti pa Buli Wiik",
    monthly_report: "Ripoti pa Buli Dwe",
    custom_range: "Kaka Cawa",
    net_profit: "Gamo Gin Man Dwe",
    total_revenue: "Wel Gin Dwe",
    total_expenses: "Wel Gin Dwe ma Olokko",
    total_sales: "Wel Gin Dwe ma Ogamo",
    no_transactions_found: "Pee tiro mo ma otimo i cawa ma oyero.",
    total_deposits: "Wel Gin Dwe ma Ogamo",
    total_withdrawals: "Wel Gin Dwe ma Olokko",
    total_float_change: "Kaka Float ma Oloko",
    profit_from_fees: "Gamo Gin Man Dwe pa Fees",
    summary: "Ngero Dwe",
    daily_summary_title: "Ngero pa Nino",
    detailed_transactions: "Tiro Mu Bubu",
    print_report: "Kwano Ripoti",
    share_report: "Gaba Ripoti",

    // --- History Screen ---
    transaction_history_title: "Tarac pa Tiro",
    view_history: "Neno Tarac",
    history_title: "Tarac pa Tiro",

    // --- Settings Screen ---
    language_settings: "Kwano Leb",
    app_settings: "Kwano App",
    change_language: "Loko Leb",
    set_agent_status: "Kwano Hali pa Mobile Money Agent",
    confirm_agent_status_change_title: "Kwano Hali pa Agent",
    confirm_agent_status_change_message:
      "Loko man bikonye lok gin ki tiro, pi ningo iye ni itye kwede.",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  lgo: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Wanongo i ",

    // --- General ---
    hello_world: "Loro",
    welcome: "Wanongo",
    login: "Donge",
    username: "Nying ngat",
    password: "Lok",
    submit: "Timo",
    logout: "Yweko",
    cancel: "Juko",
    delete: "Juko",
    edit: "Loko",
    save: "Miyo",
    add: "Medo",
    select_language: "Yero leb",
    ugandan_shillings: "Cilingi pa Uganda",
    confirm_delete: "Kwano Juko",
    confirm_delete_message:
      "Ikwano ni ijwero juko ginni? Tim maci pe twero lokke.",
    item_deleted: "Gin jukko maber!",
    error_deleting_item: "Pe otwero juko ginni. Tem doki.",
    error_loading_inventory: "Pe otwero laro gin-ni. Tem doki.",
    clear_inventory_cancelled: "Juko gin-ni ojuko.",
    inventory_cleared_success: "Gin-ni ojwenge jwi!",
    inventory_cleared_error: "Pe otwero jwengo gin-ni. Tem doki.",
    save_failed: "Pe otwero miyo. Tem doki.",
    save_success: "Omiyo maber!",

    // --- Home Screen ---
    home_title: "Gang",
    manage_inventory: "Timo Gin",
    manage_float: "Timo Float",
    record_transactions: "Kwano Tiro",
    view_reports: "Neno Ripoti",
    settings: "Kwano",
    is_mobile_money_agent: "In iling Mobile Money Agent?",
    yes: "Ee",
    no: "Pe",
    agent_status_saved: "Hali pa agent omiyo!",
    tip_home: "Akobota: Senya piny pi laro gang!", // New tip for home screen

    // --- Inventory/Float Management Screen ---
    inventory_title: "Timo Gin",
    mobile_money_float: "Float pa Mobile Money",
    item_name: "Nyingi Gin",
    current_stock: "Gin Man Okato",
    cost_price: "Wel Gin (UGX)",
    selling_price: "Wel Gin ma twero gamo (UGX)",
    item_total_cost_value: "Wel Gin Man",
    item_total_selling_value: "Wel Gin ma Twero Gamo",
    inventory_value_cost: "Wel Gin Man Dwe",
    inventory_value_sales: "Wel Gin ma Twero Gamo Dwe",
    clear_inventory_button: "Juko Gin Man Dwe",
    confirm_clear_inventory_title: "Kwano Juko Gin",
    confirm_clear_inventory_message:
      "Ikwano ni ijwero juko gin DWE i gin-ni? Tim maci pe twero lokke.",
    no_inventory_items: "Pee gin mo i gin-ni matye kwede.",

    // Agent Specific Inventory Labels
    network_name: "Nyingi Network",
    current_float: "E-Value (Float) Ma Tye Kwede",
    initial_float_value: "Wel Gin Man Ma Kwede",
    fee_per_transaction: "Wel Kwede pa Tiro (UGX)",
    network_cash_equivalent: "Wel Gin Ma Tye Kwede i Network",
    network_e_value_equivalent: "Wel E-Value Ma Tye Kwede i Network",
    total_physical_cash: "Wel Gin Man Dwe",
    total_e_value_float: "Wel E-Value Float Dwe",
    clear_float_history: "Juko Tarac pa Float",
    no_networks_added: "Pee Mobile Money Networks Matye Kwede.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Medo Gin Nyen",
    edit_item_title: "Loko Gin",
    manage_item_title: "Timo Gin",
    add_new_item_title: "Medo Gin Nyen",
    item_name_placeholder: "k.m., Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "k.m., 50, 1000000",
    cost_price_placeholder: "k.m., 1500, 990",
    selling_price_placeholder: "k.m., 2000, 1000",
    stock_quantity: "Kaka Gin Man",
    float_amount: "Kaka Float",
    cost_value: "Wel Gin Man",
    selling_value: "Wel Gin ma Twero Gamo",
    item_saved_success: "Gin omiyo maber!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Kwano Tiro",
    transactions_title: "Kwano Tiro",
    select_transaction_type: "Yero Kaka Tiro",
    sales: "Gin ma Ogamo",
    expense: "Gin ma Olokko",
    mobile_money_deposit: "Mobile Money Ogamo",
    mobile_money_withdrawal: "Mobile Money Olokko",
    record_sale: "Kwano Ma Gamo",
    record_restock: "Kwano Medo",
    record_withdrawal: "Kwano Loko",
    record_deposit: "Kwano Gamo",
    transaction_type: "Kaka Tiro",
    amount: "Wel (UGX)",
    description: "Ngero",
    date: "Nino",
    time: "Cawa",
    record: "Kwano",
    transaction_recorded_success: "Tiro okwano maber!",
    error_recording_transaction: "Adwogi pa kwano tiro. Tem doki.",
    select_item: "Yero Gin",
    quantity_sold: "Kaka Gin ma Ogamo",
    price_per_unit: "Wel Kwede pa Tiro (UGX)",
    total_amount: "Wel Gin Dwe",
    category: "Kaka",
    select_category: "Yero Kaka",
    select_item_first: "Tem yero gin mukwongo.",
    cost_per_unit: "Wel Kwede pa Tiro (UGX)",
    item: "Gin",
    cash_in: "Cilingi Oloko",
    cash_out: "Cilingi Okato",
    fee: "Fee",
    network: "Network",
    select_network: "Yero Network",
    phone_number: "Namba pa Cawa",
    transaction_id: "Namba pa Tiro",
    customer_name: "Nyingi Laco (Optional)",
    transaction_details: "Amakuru Pa Tiro",
    insufficient_stock: "Gin man pe twero gamo kony.",
    insufficient_float: "Float pe twero gamo kony i network ni.",
    update_item_stock_error: "Adwogi pa loko stock pa gin.",
    update_float_error: "Adwogi pa loko float.",

    // --- Reports Screen ---
    reports_title: "Ripoti",
    generate_report: "Timo Ripoti",
    start_date: "Nino pa Cawa",
    end_date: "Nino pa Cawa Cawa",
    daily_report: "Ripoti pa Buli Nino",
    weekly_report: "Ripoti pa Buli Wiik",
    monthly_report: "Ripoti pa Buli Dwe",
    custom_range: "Kaka Cawa",
    net_profit: "Gamo Gin Man Dwe",
    total_revenue: "Wel Gin Dwe",
    total_expenses: "Wel Gin Dwe ma Olokko",
    total_sales: "Wel Gin Dwe ma Ogamo",
    no_transactions_found: "Pee tiro mo ma otimo i cawa ma oyero.",
    total_deposits: "Wel Gin Dwe ma Ogamo",
    total_withdrawals: "Wel Gin Dwe ma Olokko",
    total_float_change: "Kaka Float ma Oloko",
    profit_from_fees: "Gamo Gin Man Dwe pa Fees",
    summary: "Ngero Dwe",
    daily_summary_title: "Ngero pa Nino",
    detailed_transactions: "Tiro Mu Bubu",
    print_report: "Kwano Ripoti",
    share_report: "Gaba Ripoti",

    // --- History Screen ---
    transaction_history_title: "Tarac pa Tiro",
    view_history: "Neno Tarac",
    history_title: "Tarac pa Tiro",

    // --- Settings Screen ---
    language_settings: "Kwano Leb",
    app_settings: "Kwano App",
    change_language: "Loko Leb",
    set_agent_status: "Kwano Hali pa Mobile Money Agent",
    confirm_agent_status_change_title: "Kwano Hali pa Agent",
    confirm_agent_status_change_message:
      "Loko man bikonye lok gin ki tiro, pi ningo iye ni itye kwede.",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
  sog: {
    // --- App Name ---
    app_name: "Hand Shop",
    greeting_prefix: "Mubegera mu ",

    // --- General ---
    hello_world: "Mulembe!",
    welcome: "Mubegera",
    login: "Yingira",
    username: "Eriinya ly'omukozi",
    password: "Ekirongo",
    submit: "Leeta",
    logout: "Fuumuula",
    cancel: "Siimuula",
    delete: "Siimuula",
    edit: "Kyusa",
    save: "Zikuusa",
    add: "Gatta",
    select_language: "Londa olulimi",
    ugandan_shillings: "Ensiringi z'e Uganda",
    confirm_delete: "Kakasa okusiimuula",
    confirm_delete_message:
      "Oli mukakasa okusiimuula ekintu kino? Ekikolwa kino tekisoboka okudibizibwa.",
    item_deleted: "Ekintu kiziikusiddwa bulungi!",
    error_deleting_item: "Okusiimuula ekintu kwagaanye. Gerageza nate.",
    error_loading_inventory: "Okulonda eby'amaguzi kwagaanye. Gerageza nate.",
    clear_inventory_cancelled: "Okusiimuula eby'amaguzi kusaziddwaamu.",
    inventory_cleared_success: "Eby'amaguzi biziikusiddwa bulungi!",
    inventory_cleared_error:
      "Okusiimuula eby'amaguzi kwagaanye. Gerageza nate.",
    save_failed: "Okuzikuusa kwagaanye. Gerageza nate.",
    save_success: "Kiziikusiddwa bulungi!",

    // --- Home Screen ---
    home_title: "Eka",
    manage_inventory: "Kola ku by'amaguzi",
    manage_float: "Kola ku float",
    record_transactions: "Wandiika ebitundibwa",
    view_reports: "Laba lipooti",
    settings: "Ebirongezo",
    is_mobile_money_agent: "Oli Mobile Money Agent?",
    yes: "Yee",
    no: "Nedda",
    agent_status_saved: "Enkola y'omukazi ezikuusiddwa!",
    tip_home: "Akabonero: Senya wansi okuddamu okulaba eby'awaka!",

    // --- Inventory/Float Management Screen ---
    inventory_title: "Enkola y'Eby'amaguzi",
    mobile_money_float: "Eya Mobile Money Float",
    item_name: "Eriinya ly'ekintu",
    current_stock: "Eby'amaguzi ebiriwo kati",
    cost_price: "Omuwendo gw'ekikoleddwaako (UGX)",
    selling_price: "Omuwendo gw'ekitundibwa (UGX)",
    item_total_cost_value: "Omuwendo gwonna ogw'ekikoleddwaako",
    item_total_selling_value: "Omuwendo gwonna ogw'ekitundibwa",
    inventory_value_cost: "Omutindo gw'eby'amaguzi byonna",
    inventory_value_sales: "Omutindo gw'eby'amaguzi byonna ebyatundibwa",
    clear_inventory_button: "Siimuula eby'amaguzi byonna",
    confirm_clear_inventory_title: "Kakasa okusiimuula eby'amaguzi",
    confirm_clear_inventory_message:
      "Oli mukakasa okusiimuula ebintu BYONNA mu by'amaguzi? Ekikolwa kino tekisoboka okudibizibwa.",
    no_inventory_items: "Tewali bintu by'amaguzi bigattiddwaako.",

    // Agent Specific Inventory Labels
    network_name: "Eriinya ly'akakywagi",
    current_float: "Eya E-Value (Float) eriwo kati",
    initial_float_value: "Ensima ezikwata float",
    fee_per_transaction: "Fee ku kakolwa konna (UGX)",
    network_cash_equivalent: "Ensima ezikwata akakywagi",
    network_e_value_equivalent: "Eya akakywagi E-Value eriwo",
    total_physical_cash: "Ensima zonna eziriwo",
    total_e_value_float: "Eya E-Value Float yonna",
    clear_float_history: "Siimuula ebyayita mu float",
    no_networks_added: "Tewali Mobile Money Networks eggattiddwaako.",

    // --- Manage Item Screen (Add/Edit) ---
    add_item_title: "Gatta ekintu kipya",
    edit_item_title: "Kyusa ekintu",
    manage_item_title: "Kola ku Kintu",
    add_new_item_title: "Gatta ekintu kipya",
    item_name_placeholder: "e.g., Soda, Airtime MTN, Airtel Float",
    current_stock_placeholder: "e.g., 50, 1000000",
    cost_price_placeholder: "e.g., 1500, 990",
    selling_price_placeholder: "e.g., 2000, 1000",
    stock_quantity: "Obungi bw'eby'amaguzi",
    float_amount: "Obungi bwa float",
    cost_value: "Omuwendo gw'ekikoleddwaako",
    selling_value: "Omuwendo gw'ekitundibwa",
    item_saved_success: "Ekintu kiziikusiddwa bulungi!",

    // --- Transaction Recording Screen ---
    record_transaction_title: "Wandiika Ekitundibwa",
    transactions_title: "Wandiika Ebitundibwa",
    select_transaction_type: "Londa ekika ky'ekitundibwa",
    sales: "Ebitundibwa",
    expense: "Ebinafulumye",
    mobile_money_deposit: "Mobile Money Okuteekawo",
    mobile_money_withdrawal: "Mobile Money Okuggyako",
    record_sale: "Wandiika Ekitundibwa",
    record_restock: "Wandiika Okugatta",
    record_withdrawal: "Wandiika Okuggyako",
    record_deposit: "Wandiika Okuteekawo",
    transaction_type: "Ekika ky'ekitundibwa",
    amount: "Omuwendo (UGX)",
    description: "Ebyogerwako",
    date: "Olunaku",
    time: "Akaseera",
    record: "Wandiika",
    transaction_recorded_success: "Ekitundibwa kiwandiikiddwa bulungi!",
    error_recording_transaction:
      "Wabaddewo ensobi mu kuwandiika ekitundibwa. Gerageza nate.",
    select_item: "Londa ekintu",
    quantity_sold: "Obungi obwatundibwa",
    price_per_unit: "Omuwendo ku kintu kimu (UGX)",
    total_amount: "Omuwendo gwonna",
    category: "Ekika",
    select_category: "Londa ekika",
    select_item_first: "Londa ekintu kimu olubereberye.",
    cost_per_unit: "Omuwendo ku ka unit (UGX)",
    item: "Ekintu",
    cash_in: "Ensima zizingidde",
    cash_out: "Ensima zafulumye",
    fee: "Fee",
    network: "Akakywagi",
    select_network: "Londa akakywagi",
    phone_number: "Ekimu kya ssimu",
    transaction_id: "Namba y'ekitundibwa",
    customer_name: "Eriinya ly'omuguzi (Optional)",
    transaction_details: "Ebyogerwako by'ekitundibwa",
    insufficient_stock: "Eby'amaguzi tebimala ku kintu kino.",
    insufficient_float: "Eya float tennamala ku akakywagi kano.",
    update_item_stock_error: "Wabaddewo ensobi mu kuteekawo eby'amaguzi.",
    update_float_error: "Wabaddewo ensobi mu kuteekawo float.",

    // --- Reports Screen ---
    reports_title: "Lipooti",
    generate_report: "Kola lipooti",
    start_date: "Olunaku olusooka",
    end_date: "Olunaku olukomekkerezo",
    daily_report: "Lipooti ya buli lunaku",
    weekly_report: "Lipooti ya buli wiki",
    monthly_report: "Lipooti ya buli mwezi",
    custom_range: "Ekikoma eky'eyiyo",
    net_profit: "Amagoba agenkanankana",
    total_revenue: "Omugatte gw'ensimbi ezizingidde",
    total_expenses: "Omugatte gw'ebyafulumye",
    total_sales: "Omugatte gw'ebitundibwa",
    no_transactions_found:
      "Tewali bitundibwa bisangiddwa mu kiseera ekyalondeddwamu.",
    total_deposits: "Omugatte gw'ebiteekeddwawo",
    total_withdrawals: "Omugatte gw'ebiggyiddwako",
    total_float_change: "Okukyuka kwonna okwa float",
    profit_from_fees: "Amagoba okuva mu fees",
    summary: "Omukwano omupya",
    daily_summary_title: "Omukwano Ogwa Buli Lunaku",
    detailed_transactions: "Ebitundibwa mu bubu",
    print_report: "Kuba lipooti",
    share_report: "Gaba lipooti",

    // --- History Screen ---
    transaction_history_title: "Ebyafaayo by'Ebitundibwa",
    view_history: "Laba Ebyafaayo",
    history_title: "Ebyafaayo by'Ebitundibwa",

    // --- Settings Screen ---
    language_settings: "Ebirongezo by'olulimi",
    app_settings: "Ebirongezo bya App",
    change_language: "Kyusa olulimi",
    set_agent_status: "Teekawo ekifo ky'omukozi wa Mobile Money",
    confirm_agent_status_change_title: "Kakasa okukyusa ekifo ky'omukozi",
    confirm_agent_status_change_message:
      "Okukyusa kino kyakyuusa engeri eby'amaguzi n'ebitundibwa gye biragibwamu era gye bibalibwamu. Oli mukakasa okugenda mu maaso?",

    // --- Language Names ---
    english: "English",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
  },
};

// --- Language Provider Component ---
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default to English
  const [initialLoad, setInitialLoad] = useState(true);

  // Function to determine the best language to use
  const getDeviceLanguage = useCallback(() => {
    const locale = Localization.getLocales()[0];
    const systemLanguage = locale ? locale.languageCode : "en"; // e.g., 'en', 'lg'

    // Check if the system language is one of our supported languages
    if (translations[systemLanguage]) {
      return systemLanguage;
    }

    // Fallback to a broader language if a specific dialect isn't supported
    // For example, if system is 'sw-TZ' but we only have 'sw'
    const baseLanguage = systemLanguage.split("-")[0];
    if (translations[baseLanguage]) {
      return baseLanguage;
    }

    return "en"; // Default fallback
  }, []);

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem(
          ASYNC_STORAGE_LANG_KEY
        );
        if (storedLanguage && translations[storedLanguage]) {
          setLanguage(storedLanguage);
        } else {
          // If no language is stored or stored language is not supported,
          // try to use device language
          const deviceLang = getDeviceLanguage();
          setLanguage(deviceLang);
          await AsyncStorage.setItem(ASYNC_STORAGE_LANG_KEY, deviceLang); // Save it for next time
        }
      } catch (error) {
        console.error("Failed to load language from storage:", error);
        setLanguage("en"); // Fallback on error
      } finally {
        setInitialLoad(false);
      }
    };

    loadLanguage();
  }, [getDeviceLanguage]);

  // Function to change the language
  const changeLanguage = useCallback(async (newLanguageCode) => {
    if (translations[newLanguageCode]) {
      setLanguage(newLanguageCode);
      try {
        await AsyncStorage.setItem(ASYNC_STORAGE_LANG_KEY, newLanguageCode);
      } catch (error) {
        console.error("Failed to save language to storage:", error);
      }
    } else {
      console.warn(`Language code '${newLanguageCode}' is not supported.`);
    }
  }, []);

  // Translation function
  const t = useCallback(
    (key) => {
      // Return key if translations are not yet loaded or if key is missing
      if (!translations[language] || !translations[language][key]) {
        console.warn(
          `Translation key '${key}' not found for language '${language}'.`
        );
        // Fallback to English if key is missing in current language
        if (translations.en && translations.en[key]) {
          return translations.en[key];
        }
        return key; // Return the key itself if no translation is found
      }
      return translations[language][key];
    },
    [language] // Recalculate t when language changes
  );

  if (initialLoad) {
    // You might want to render a loading spinner here
    return null;
  }

  return (
    <LanguageContext.Provider value={{ t, language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// --- Custom Hook for Language Context ---
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
