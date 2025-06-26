// context/LanguageContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const translations = {
  en: {
    home_heading: "👋 Hand Shop",
    record_sale: "Record Sale",
    record_restock: "Record Restock",
    view_summary: "View Daily Summary",
    view_history: "View History",
    manage_inventory: "Manage Inventory",
    tip_home:
      "🎙️ Tip: Use the 🎤 mic icon on your keyboard to quickly dictate item name or quantity.",
    item_name: "Item Name",
    quantity: "Quantity",
    item_name_placeholder: "e.g. Sugar",
    quantity_placeholder: "e.g. 3",
    cost_price: "Cost Price (per unit)",
    selling_price: "Selling Price (per unit)",
    record_transaction: "Record Transaction",
    sale_recorded: "Sale recorded successfully",
    restock_recorded: "Restock recorded successfully",
    error_saving: "Error saving transaction. Please try again.",
    item_name_required: "Item name is required",
    quantity_required: "Quantity is required",
    valid_quantity: "Enter a valid quantity",
    tip_transaction:
      "🎤 Tip: Tap the mic icon on your **keyboard** to speak item name or quantity.",
    record_a_sale: "Record a Sale",
    record_a_restock: "Record a Restock",
    todays_summary: "Daily Summary",
    sales: "Sales Count",
    restocks: "Restocks Count",
    transaction_history: "Transaction History",
    no_transactions: "No transactions yet.",
    sold: "Sold",
    restocked: "Restocked",
    select_language: "Select Language:",
    english: "English",
    luganda: "Luganda",
    swahili: "Kiswahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Voice recognition failed. Please try again.",
    inventory_title: "Shop Inventory",
    add_new_item: "Add New Item",
    no_inventory_items: "No inventory items yet.",
    current_stock: "Current Stock",
    edit_item: "Edit Item",
    save_item: "Save Item",
    item_saved: "Item saved successfully!",
    item_deleted: "Item deleted successfully!",
    confirm_delete: "Are you sure you want to delete this item?",
    insufficient_stock: "Insufficient stock for this sale.",
    item_not_found: "Item not found in inventory.",
    error_loading_summary: "Error loading summary data.",
    inventory_value_cost: "Inventory Value (Cost)",
    inventory_value_sales: "Inventory Value (Potential Sales)",
    total_sales_revenue: "Total Sales Revenue (Current Period)",
    total_cost_of_restocks: "Total Cost of Restocks (Current Period)",
    item_total_cost_value: "Total Cost Value (this item)",
    item_total_selling_value: "Total Selling Value (this item)",
    clear_inventory_button: "Clear All Inventory",
    confirm_clear_inventory_title: "Confirm Clear Inventory",
    confirm_clear_inventory_message:
      "Are you absolutely sure you want to clear ALL inventory data? This action cannot be undone.",
    clear_inventory_cancelled: "Inventory clear cancelled.",
    inventory_cleared_success: "All inventory cleared successfully!",
    inventory_cleared_error: "Error clearing inventory.",
    close_business: "Close Business (Calculate & Reset)",
    confirm_close_business_title: "Confirm Close Business",
    confirm_close_business_message:
      "Are you sure you want to close business for this period? This will calculate the summary and reset the period for the next day's transactions.",
    close_business_cancelled: "Close Business operation cancelled.",
    close_business_success:
      "Business closed and summary calculated successfully!",
    close_business_error: "Error closing business and calculating summary.",
    no_summary_data: "Press 'Close Business' to view summary for this period.",
    no_transactions_for_period:
      "No transactions recorded for the current period.",
    no_new_transactions_to_close:
      "No new transactions to summarize for this period.",
    press_close_business_to_view:
      "Record some transactions, then press 'Close Business' to view summary.",
    clear_history_button: "Clear All History", // New translation
    confirm_clear_history_title: "Confirm Clear History", // New translation
    confirm_clear_history_message:
      "Are you absolutely sure you want to clear ALL transaction history? This action cannot be undone.", // New translation
    clear_history_cancelled: "History clear cancelled.", // New translation
    history_cleared_success: "All transaction history cleared successfully!", // New translation
    history_cleared_error: "Error clearing transaction history.", // New translation
  },
  lg: {
    // Luganda
    home_heading: "👋 Dduuka mu Ngalo Yo",
    record_sale: "Wandiika Ekitundiddwa",
    record_restock: "Wandiika Ekigasse",
    view_summary: "Laba Ebyasumululwa Eby'olunaku",
    view_history: "Laba Ebyafaayo",
    manage_inventory: "Gendera Ku Byanika",
    tip_home:
      "🎙️ Amagezi: Kozesa akatamiro ka 🎤 mic ku keyboard yo okwogera amannya g'ebintu oba omuwendo mangu.",
    item_name: "Erinnya ly'Ekintu",
    quantity: "Omuwendo",
    item_name_placeholder: "Eky'okulabirako: Sukari",
    quantity_placeholder: "Eky'okulabirako: 3",
    cost_price: "Ebeeyi Gye Kiguliddwa (ku kamu)",
    selling_price: "Ebeeyi Gye Kitundibwa (ku kamu)",
    record_transaction: "Wandiika Enkola",
    sale_recorded: "Ekitundiddwa kiwandiddwa bulungi",
    restock_recorded: "Ekigasse kiwandiddwa bulungi",
    error_saving: "Wabaddewo ensobi mu kuwanika enkozesa. Ggukiriza nate.",
    item_name_required: "Erinnya ly'ekintu lyetaagisa",
    quantity_required: "Omuwendo gwetaagisa",
    valid_quantity: "Wandiika omuwendo ogumala",
    tip_transaction:
      "🎤 Amagezi: Kanyiga akatamiro ka mic ku **keyboard** yo okwogera erinnya ly'ekintu oba omuwendo.",
    record_a_sale: "Wandiika Ekitundiddwa",
    record_a_restock: "Wandiika Ekigasse",
    todays_summary: "Ebyasumululwa Eby'olunaku",
    sales: "Omuwendo gw'Ebitundiddwa",
    restocks: "Omuwendo gw'Ebigasse",
    transaction_history: "Ebyafaayo By'enkozesa",
    no_transactions: "Tewali nkozesa n'emu.",
    sold: "Kitundiddwa",
    restocked: "Kigasse",
    select_language: "Londa Olulimi:",
    english: "Lungereza",
    luganda: "Luganda",
    swahili: "Kiswahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Voice recognition failed. Please try again.",
    inventory_title: "Byanika bya Dduuka",
    add_new_item: "Gatta Ekintu Ekiggya",
    no_inventory_items: "Tewali bintu mu byanika.",
    current_stock: "Omuwendo Oguliwo",
    edit_item: "Kyusa Ekintu",
    save_item: "Wanika Ekintu",
    item_saved: "Ekintu kiwaniddwa bulungi!",
    item_deleted: "Ekintu kiggiddwawo bulungi!",
    confirm_delete: "Oli mukakasa okuggyawo ekintu kino?",
    insufficient_stock: "Ebyanika tebimala okutunda.",
    item_not_found: "Ekintu tekyasanyiziddwa mu byanika.",
    error_loading_summary: "Wabaddewo ensobi mu kuleeta ebyasumululwa.",
    inventory_value_cost: "Ebeeyi y'Ebyanika (Ekyaguliddwa)",
    inventory_value_sales: "Ebeeyi y'Ebyanika (Ebyanditundiddwa)",
    total_sales_revenue: "Ensigo y'Ebitundiddwa (Ekiseera Kino)",
    total_cost_of_restocks: "Ensigo y'Okugassa (Ekiseera Kino)",
    item_total_cost_value: "Ensigo Yonna (Ekyaguliddwa)",
    item_total_selling_value: "Ensigo Yonna (Ebyanditundiddwa)",
    clear_inventory_button: "Ggyawo Byanika Byonna",
    confirm_clear_inventory_title: "Kakasa Okuggyawo Byanika",
    confirm_clear_inventory_message:
      "Oli mukakasa ddala okuggyawo byanika byonna? Kino tekisobola kudibizibwa.",
    clear_inventory_cancelled: "Okuggyawo byanika kwaniziddwa.",
    inventory_cleared_success: "Byanika byonna biggiddwawo bulungi!",
    inventory_cleared_error: "Wabaddewo ensobi mu kuggyawo byanika.",
    close_business: "Ggala Bizineesi (Kubala & Sumulula)",
    confirm_close_business_title: "Kakasa Okuggala Bizineesi",
    confirm_close_business_message:
      "Oli mukakasa okuggala bizineesi ku kiseera kino? Kino kigya kubala ebyasumululwa era kisumulule ekiseera ky'enkozesa eziddako.",
    close_business_cancelled: "Okuggala bizineesi kwaniziddwa.",
    close_business_success:
      "Bizineesi eggaddwa era ebyasumululwa bibaliddwa bulungi!",
    close_business_error:
      "Wabaddewo ensobi mu kuggala bizineesi n'okubala ebyasumululwa.",
    no_summary_data:
      "Kanyiga 'Ggala Bizineesi' okulaba ebyasumululwa by'ekiseera kino.",
    no_transactions_for_period:
      "Tewali nkozesa ziwandiikiddwa mu kiseera kino.",
    no_new_transactions_to_close:
      "Tewali nkozesa mpya za kusumulula mu kiseera kino.",
    press_close_business_to_view:
      "Wandiika enkozesa, oluvanyuma kanyiga 'Ggala Bizineesi' okulaba ebyasumululwa.",
    clear_history_button: "Ggyawo Ebyafaayo Byonna", // New translation
    confirm_clear_history_title: "Kakasa Okuggyawo Ebyafaayo", // New translation
    confirm_clear_history_message:
      "Oli mukakasa ddala okuggyawo ebyafaayo byonna? Kino tekisobola kudibizibwa.", // New translation
    clear_history_cancelled: "Okuggyawo ebyafaayo kwaniziddwa.", // New translation
    history_cleared_success: "Ebyafaayo byonna biggiddwawo bulungi!", // New translation
    history_cleared_error: "Wabaddewo ensobi mu kuggyawo ebyafaayo.", // New translation
  },
  sw: {
    // Swahili
    home_heading: "👋 Duka Kiganjani",
    record_sale: "Andika Mauzo",
    record_restock: "Andika Bidhaa Mpya",
    view_summary: "Tazama Muhtasari wa Kila Siku",
    view_history: "Tazama Historia",
    manage_inventory: "Dhibiti Mizigo",
    tip_home:
      "🎙️ Kidokezo: Tumia ikoni ya 🎤 maikrofoni kwenye kibodi yako kudikta haraka jina la bidhaa au kiasi.",
    item_name: "Jina la Bidhaa",
    quantity: "Kiasi",
    item_name_placeholder: "Mfano: Sukari",
    quantity_placeholder: "Mfano: 3",
    cost_price: "Bei ya Kununua (kwa kitengo)",
    selling_price: "Bei ya Kuuza (kwa kitengo)",
    record_transaction: "Andika Muamala",
    sale_recorded: "Mauzo yameandikwa kwa ufanisi",
    restock_recorded: "Bidhaa mpya zimeandikwa kwa ufanisi",
    error_saving:
      "Hitilafu wakati wa kuhifadhi muamala. Tafadhali jaribu tena.",
    item_name_required: "Jina la bidhaa linahitajika",
    quantity_required: "Kiasi kinahitajika",
    valid_quantity: "Weka kiasi halali",
    tip_transaction:
      "🎤 Kidokezo: Gusa ikoni ya maikrofoni kwenye **kibodi** yako ili kusema jina la bidhaa au kiasi.",
    record_a_sale: "Andika Mauzo",
    record_a_restock: "Andika Bidhaa Mpya",
    todays_summary: "Muhtasari wa Kila Siku",
    sales: "Idadi ya Mauzo",
    restocks: "Idadi ya Bidhaa Mpya",
    transaction_history: "Historia ya Miamala",
    no_transactions: "Hakuna miamala bado.",
    sold: "Imeuzwa",
    restocked: "Imetiwa bidhaa mpya",
    select_language: "Chagua Lugha:",
    english: "Kiingereza",
    luganda: "Luganda",
    swahili: "Kiswahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Voice recognition failed. Tafadhali jaribu tena.",
    inventory_title: "Mizigo ya Duka",
    add_new_item: "Ongeza Bidhaa Mpya",
    no_inventory_items: "Hakuna bidhaa kwenye mizigo bado.",
    current_stock: "Akiba Iliyopo",
    edit_item: "Hariri Bidhaa",
    save_item: "Hifadhi Bidhaa",
    item_saved: "Bidhaa imehifadhiwa kwa ufanisi!",
    item_deleted: "Bidhaa imefutwa kwa ufanisi!",
    confirm_delete: "Una uhakika unataka kufuta bidhaa hii?",
    insufficient_stock: "Akiba haitoshi kwa mauzo haya.",
    item_not_found: "Bidhaa haikupatikana kwenye mizigo.",
    error_loading_summary: "Hitilafu wakati wa kupakia muhtasari.",
    inventory_value_cost: "Thamani ya Mizigo (Bei ya Kununua)",
    inventory_value_sales: "Thamani ya Mizigo (Mauzo Yanayoweza Kuwezekana)",
    total_sales_revenue: "Jumla ya Mapato ya Mauzo (Kipindi Hiki)",
    total_cost_of_restocks: "Jumla ya Gharama za Bidhaa Mpya (Kipindi Hiki)",
    item_total_cost_value: "Jumla ya Gharama (bidhaa hii)",
    item_total_selling_value: "Jumla ya Mauzo (bidhaa hii)",
    clear_inventory_button: "Futa Mizigo Yote",
    confirm_clear_inventory_title: "Thibitisha Kufuta Mizigo",
    confirm_clear_inventory_message:
      "Una uhakika kabisa unataka kufuta data ZOTE za mizigo? Kitendo hiki hakiwezi kutenduliwa.",
    clear_inventory_cancelled: "Kufuta mizigo kumeghairiwa.",
    inventory_cleared_success: "Mizigo yote imefutwa kwa ufanisi!",
    inventory_cleared_error: "Hitilafu wakati wa kufuta mizigo.",
    close_business: "Funga Biashara (Hesabu & Weka Upya)",
    confirm_close_business_title: "Thibitisha Kufunga Biashara",
    confirm_close_business_message:
      "Una uhakika unataka kufunga biashara kwa kipindi hiki? Hii itahesabu muhtasari na kuweka upya kipindi cha miamala ijayo.",
    close_business_cancelled: "Operesheni ya kufunga biashara imeghairiwa.",
    close_business_success:
      "Biashara imefungwa na muhtasari umehesabiwa kwa ufanisi!",
    close_business_error:
      "Hitilafu wakati wa kufunga biashara na kuhesabu muhtasari.",
    no_summary_data:
      "Bonyeza 'Funga Biashara' ili kuona muhtasari wa kipindi hiki.",
    no_transactions_for_period: "Hakuna miamala iliyoandikwa kwa kipindi hiki.",
    no_new_transactions_to_close:
      "Hakuna miamala mipya ya kuhitimisha kwa kipindi hiki.",
    press_close_business_to_view:
      "Andika miamala, kisha bonyeza 'Funga Biashara' ili kuona muhtasari.",
    clear_history_button: "Futa Historia Yote", // New translation
    confirm_clear_history_title: "Thibitisha Kufuta Historia", // New translation
    confirm_clear_history_message:
      "Una uhakika kabisa unataka kufuta historia YOTE ya miamala? Kitendo hiki hakiwezi kutenduliwa.", // New translation
    clear_history_cancelled: "Kufuta historia kumeghairiwa.", // New translation
    history_cleared_success: "Historia yote ya miamala imefutwa kwa ufanisi!", // New translation
    history_cleared_error: "Hitilafu wakati wa kufuta historia ya miamala.", // New translation
  },
  ry: {
    // Runyakitara
    home_heading: "👋 Dukani Omw'engaro Yawe",
    record_sale: "Handiika Ebyatundirwe",
    record_restock: "Handiika Ebyongiirweho",
    view_summary: "Reeba Omushomo Gw'olunaku",
    view_history: "Reeba Ebyahandiikirwe",
    manage_inventory: "Omurunda Gw'ebihagaro",
    tip_home:
      "🎙️ Akamagezi: Kozesa akabuto ka 🎤 ak'amajwi ahari kiboodi yaawe kwereeta amanya g'ebintu ninga omubare mangu.",
    item_name: "Eryooba ry'Ekintu",
    quantity: "Omubare",
    item_name_placeholder: "Eky'okureeberaho: Shuga",
    quantity_placeholder: "Eky'okureeberaho: 3",
    cost_price: "Eshente Ekyaguzirwe (ku kimwe)",
    selling_price: "Eshente Ekirukutundwa (ku kimwe)",
    record_transaction: "Andiika Ekikorwa",
    sale_recorded: "Ebyatundirwe byahandiikirwe gye",
    restock_recorded: "Ebyongiirweho byahandiikirwe gye",
    error_saving: "Habaho ensobi omu kuhandiika ekikorwa. Gerageza nate.",
    item_name_required: "Eryooba ry'ekintu niryetaagisa",
    quantity_required: "Omubare nigureetaagisa",
    valid_quantity: "Andiika omubare oguri ogwa kare",
    tip_transaction:
      "🎤 Akamagezi: Kanyiga akabuto ka mic ahari **kiboodi** yaawe kwereeta eryooba ly'ekintu ninga omubare.",
    record_a_sale: "Andiika Ebyatundirwe",
    record_a_restock: "Andiika Ebyongiirweho",
    todays_summary: "Omushomo Gw'olunaku",
    sales: "Omubare gw'Ebyatundirwe",
    restocks: "Omubare gw'Ebyongiirweho",
    transaction_history: "Ebyahandiikirwe by'Ebyakorwa",
    no_transactions: "Tihariho bikorwa n'akimwe.",
    sold: "Byatundirwe",
    restocked: "Byongiirweho",
    select_language: "Toorana Orulimi:",
    english: "Rungyereza",
    luganda: "Luganda",
    swahili: "Kiswahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Voice recognition failed. Gerageza nate.",
    inventory_title: "Ebihagaro bya Dduuka",
    add_new_item: "Gata Ekintu Ekihya",
    no_inventory_items: "Tihariho bintu n'akimwe omu bihagaro.",
    current_stock: "Omubare Oguliho",
    edit_item: "Gyenda Ekintu",
    save_item: "Hifadhi Ekintu",
    item_saved: "Ekintu kyahandiikirwe gye!",
    item_deleted: "Ekintu kyahandiikirwe gye!",
    confirm_delete: "Oli mukakasa okugyenda ekintu kinu?",
    insufficient_stock: "Omubare nigo niguhemuka okutunda.",
    item_not_found: "Ekintu tikyasanyizirwe omu bihagaro.",
    error_loading_summary: "Habaho ensobi omu kuleeta omushomo.",
    inventory_value_cost: "Eshente y'Ebihagaro (Ekyaguzirwe)",
    inventory_value_sales: "Eshente y'Ebihagaro (Ebyanditundwa)",
    total_sales_revenue: "Omuganda Gw'ebyatundirwe (Ekiseera Kinu)",
    total_cost_of_restocks:
      "Omuganda Gw'ensigo y'Ebyongiirweho (Ekiseera Kinu)",
    item_total_cost_value: "Eshente Yonna Ekyaguzirwe (ekintu kinu)",
    item_total_selling_value: "Eshente Yonna Ekirukutundwa (ekintu kinu)",
    clear_inventory_button: "Ggyaho Ebihagaro Byonna",
    confirm_clear_inventory_title: "Kakasa Okuggyaho Ebihagaro",
    confirm_clear_inventory_message:
      "Oli mukakasa ddala okuggyaho data yonna ey'ebihagaro? Kino tekisobola kudibizibwa.",
    clear_inventory_cancelled: "Okuggyaho ebihagaro kwaziyiziddwa.",
    inventory_cleared_success: "Ebihagaro byonna biggiddwawo bulungi!",
    inventory_cleared_error: "Habaho ensobi omu kuggyaho ebihagaro.",
    close_business: "Ggala Bizineesi (Kubala & Sumulula)",
    confirm_close_business_title: "Kakasa Okuggala Bizineesi",
    confirm_close_business_message:
      "Oli mukakasa okuggala bizineesi ku kiseera kino? Kinu kigya kubala omushomo n'okugyaho ekiseera ky'ebyokukola ebirukwija.",
    close_business_cancelled: "Okuggala bizineesi kwaziyiziddwa.",
    close_business_success: "Bizineesi eggaddwa n'omushomo gubalidwa gye!",
    close_business_error:
      "Habaho ensobi omu kuggala bizineesi n'okubala omushomo.",
    no_summary_data:
      "Kanyiga 'Ggala Bizineesi' kureeba omushomo gw'ekiseera kinu.",
    no_transactions_for_period:
      "Tihariho bikorwa byahandiikirwe omu kiseera kinu.",
    no_new_transactions_to_close:
      "Tihariho bikorwa bihye eby'okusumulula omu kiseera kinu.",
    press_close_business_to_view:
      "Handiika bikorwa, oluvanyuma kanyiga 'Ggala Bizineesi' kureeba omushomo.",
    clear_history_button: "Ggyaho Ebyahandiikirwe Byonna", // New translation
    confirm_clear_history_title: "Kakasa Okuggyaho Ebyahandiikirwe", // New translation
    confirm_clear_history_message:
      "Oli mukakasa ddala okuggyaho data YONNA ey'ebyokukola? Kino tekisobola kudibizibwa.", // New translation
    clear_history_cancelled: "Okuggyaho ebyahandiikirwe kwaziyiziddwa.", // New translation
    history_cleared_success: "Data yonna ey'ebyokukola egiddwawo bulungi!", // New translation
    history_cleared_error: "Habaho ensobi omu kuggyaho ebyokukola.", // New translation
  },
  ach: {
    // Acholi
    home_heading: "👋 Duka me Lwedo",
    record_sale: "Ngo'yo me Catu",
    record_restock: "Ngo'yo me Medo",
    view_summary: "Kwano Ngo'yo me Nindo",
    view_history: "Kwano Ngo'yo me Weng",
    manage_inventory: "Keto Ginmo Anyim",
    tip_home:
      "🎙️ Tado: Ti kwede mic bot keyboard-ni me lok ginmo kadi kwano mita.",
    item_name: "Nying Ginmo",
    quantity: "Kwano",
    item_name_placeholder: "Gwok: Sukari",
    quantity_placeholder: "Gwok: 3",
    cost_price: "Tina me Catu (kadi ginmo)",
    selling_price: "Tina me Tyeno (kadi ginmo)",
    record_transaction: "Ngo'yo me Tyen",
    sale_recorded: "Catu otweko",
    restock_recorded: "Ginmo omedo",
    error_saving: "Twenere kwoyiyo. Tem doki.",
    item_name_required: "Nying ginmo myero obedo",
    quantity_required: "Kwano ginmo myero obedo",
    valid_quantity: "Ngo'yo kwano me ada",
    tip_transaction:
      "🎤 Tado: Lok i mic bot keyboard-ni me lok nying ginmo kadi kwano mita.",
    record_a_sale: "Ngo'yo me Catu",
    record_a_restock: "Ngo'yo me Medo",
    todays_summary: "Ngo'yo me Nindo",
    sales: "Kwano Catu",
    restocks: "Kwano Medo",
    transaction_history: "Ngo'yo me Weng",
    no_transactions: "Pati ngo'yo mo",
    sold: "Otweko",
    restocked: "Ginmo omedo",
    select_language: "Ywer Lugha:",
    english: "Ingles",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Lok ma waromo ni konyo. Tem doki.",
    inventory_title: "Ginmo me Duka",
    add_new_item: "Medo Ginmo Manyen",
    no_inventory_items: "Pati ginmo manyen mo.",
    current_stock: "Ginmo Manyen",
    edit_item: "Lok Ginmo",
    save_item: "Twer Ginmo",
    item_saved: "Ginmo otweko!",
    item_deleted: "Ginmo omeco!",
    confirm_delete: "Ada, in miti me meco ginmo ni?",
    insufficient_stock: "Ginmo pe oromo me catu.",
    item_not_found: "Ginmo pe oromo i ginmo anyim.",
    error_loading_summary: "Twenere kwoyiyo me kwano ngo'yo.",
    inventory_value_cost: "Tina me Ginmo Anyim (Tina me Catu)",
    inventory_value_sales: "Tina me Ginmo Anyim (Tina me Tyeno)",
    total_sales_revenue: "Catu me Tina (Cawa Man)",
    total_cost_of_restocks: "Tina me Medo Ginmo (Cawa Man)",
    item_total_cost_value: "Tina Duti (ginmo ni)",
    item_total_selling_value: "Tina Duti (ginmo ni me tyeno)",
    clear_inventory_button: "Meco Ginmo Duti",
    confirm_clear_inventory_title: "Kwero Meco Ginmo",
    confirm_clear_inventory_message:
      "Ada, in miti me meco data duni duni me ginmo? Tic ni pe roko doki.",
    clear_inventory_cancelled: "Meco ginmo okano.",
    inventory_cleared_success: "Ginmo duni omeco!",
    inventory_cleared_error: "Twenere kwoyiyo me meco ginmo.",
    reset_daily_summary: "Kwero Ngo'yo me Nindo",
    confirm_reset_summary_title: "Kwero Kwero Ngo'yo",
    confirm_reset_summary_message:
      "Ada, in miti me kwero ngo'yo ni? Man bi meco catu kadi medo me ginmo me cawa ni.",
    summary_reset_cancelled: "Kwero ngo'yo okano.",
    summary_reset_success: "Ngo'yo me nindo okwero!",
    summary_reset_error: "Twenere kwoyiyo me kwero ngo'yo me nindo.",
    close_business: "Turo Tic (Kwano & Kwero)",
    confirm_close_business_title: "Kwero Turo Tic",
    confirm_close_business_message:
      "Ada, in miti me turo tic me cawa ni? Man bi kwano ngo'yo kadi kwero cawa ni me tic ma bino.",
    close_business_cancelled: "Turo tic okano.",
    close_business_success: "Tic oturo kadi ngo'yo okwano!",
    close_business_error: "Twenere kwoyiyo me turo tic kadi kwano ngo'yo.",
    no_summary_data: "Pot Turo Tic me neno ngo'yo me cawa ni.",
    no_transactions_for_period: "Pati tic mo ma ogo'yo i cawa ni.",
    no_new_transactions_to_close: "Pati tic manyen mo ma bi turo me cawa ni.",
    press_close_business_to_view:
      "Ngo'yo tic, kadi pot Turo Tic me neno ngo'yo.",
    clear_history_button: "Meco Ngo'yo Duti", // New translation
    confirm_clear_history_title: "Kwero Meco Ngo'yo", // New translation
    confirm_clear_history_message:
      "Ada, in miti me meco data duni duni me ngo'yo? Tic ni pe roko doki.", // New translation
    clear_history_cancelled: "Meco ngo'yo okano.", // New translation
    history_cleared_success: "Ngo'yo duni omeco!", // New translation
    history_cleared_error: "Twenere kwoyiyo me meco ngo'yo.", // New translation
  },
  lgo: {
    // Lango
    home_heading: "👋 Dukala me Anyim",
    record_sale: "Ngo'yo Cat",
    record_restock: "Ngo'yo Medo",
    view_summary: "Neno Ngo'yo me Nindo",
    view_history: "Neno Ngo'yo me Kony",
    manage_inventory: "Keto Ginmo",
    tip_home: "🎙️ Wany: Ti kwede mic bot keyboard-ni me lok ginmo kadi kwano.",
    item_name: "Nying Ginmo",
    quantity: "Kwano",
    item_name_placeholder: "Ok: Sukari",
    quantity_placeholder: "Ok: 3",
    cost_price: "Tina me Cat (ginmo komi)",
    selling_price: "Tina me Tyen (ginmo komi)",
    record_transaction: "Ngo'yo Tic",
    sale_recorded: "Catu otweko",
    restock_recorded: "Medo otweko",
    error_saving: "Kwoyiyo tic. Tem doki.",
    item_name_required: "Nying ginmo myero obedo",
    quantity_required: "Kwano ginmo myero obedo",
    valid_quantity: "Ngo'yo kwano me ada",
    tip_transaction:
      "🎤 Wany: Ti mic bot keyboard-ni me lok nying ginmo kadi kwano.",
    record_a_sale: "Ngo'yo Cat",
    record_a_restock: "Ngo'yo Medo",
    todays_summary: "Ngo'yo me Nindo",
    sales: "Kwano Cat",
    restocks: "Kwano Medo",
    transaction_history: "Ngo'yo Tic",
    no_transactions: "Pati tic mo",
    sold: "Otweko",
    restocked: "Medo otweko",
    select_language: "Ywer Lugha:",
    english: "Ingles",
    luganda: "Luganda",
    swahili: "Swahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Lok ma waromo ni konyo. Tem doki.",
    inventory_title: "Ginmo me Duka",
    add_new_item: "Medo Ginmo Manyen",
    no_inventory_items: "Pati ginmo manyen mo.",
    current_stock: "Ginmo Manyen",
    edit_item: "Lok Ginmo",
    save_item: "Twer Ginmo",
    item_saved: "Ginmo otweko!",
    item_deleted: "Ginmo omeco!",
    confirm_delete: "Ada, in miti me meco ginmo ni?",
    insufficient_stock: "Ginmo pe oromo me catu.",
    item_not_found: "Ginmo pe oromo i ginmo anyim.",
    error_loading_summary: "Kwoyiyo me kwano ngo'yo.",
    inventory_value_cost: "Tina me Ginmo Anyim (Tina me Cat)",
    inventory_value_sales: "Tina me Ginmo Anyim (Tina me Tyen)",
    total_sales_revenue: "Catu me Tina (Cawa Man)",
    total_cost_of_restocks: "Tina me Medo Ginmo (Cawa Man)",
    item_total_cost_value: "Tina Duti (ginmo ni)",
    item_total_selling_value: "Tina Duti (ginmo ni me tyeno)",
    clear_inventory_button: "Meco Ginmo Duti",
    confirm_clear_inventory_title: "Kwero Meco Ginmo",
    confirm_clear_inventory_message:
      "Ada, in miti me meco data duni duni me ginmo? Tic ni pe roko doki.",
    clear_inventory_cancelled: "Meco ginmo okano.",
    inventory_cleared_success: "Ginmo duni omeco!",
    inventory_cleared_error: "Kwoyiyo me meco ginmo.",
    reset_daily_summary: "Kwero Ngo'yo me Dwe",
    confirm_reset_summary_title: "Kwero Kwero Ngo'yo",
    confirm_reset_summary_message:
      "Ada, in miti me kwero ngo'yo ni? Man bi meco catu kadi medo me ginmo me cawa ni.",
    summary_reset_cancelled: "Kwero ngo'yo okano.",
    summary_reset_success: "Ngo'yo me dwe okwero!",
    summary_reset_error: "Kwoyiyo me kwero ngo'yo me dwe.",
    close_business: "Turo Tic (Kwano & Kwero)",
    confirm_close_business_title: "Kwero Turo Tic",
    confirm_close_business_message:
      "Ada, in miti me turo tic me cawa ni? Man bi kwano ngo'yo kadi kwero cawa ni me tic ma bino.",
    close_business_cancelled: "Turo tic okano.",
    close_business_success: "Tic oturo kadi ngo'yo okwano!",
    close_business_error: "Twenere kwoyiyo me turo tic kadi kwano ngo'yo.",
    no_summary_data: "Pot Turo Tic me neno ngo'yo me cawa ni.",
    no_transactions_for_period: "Pati tic mo ma ogo'yo i cawa ni.",
    no_new_transactions_to_close: "Pati tic manyen mo ma bi turo me cawa ni.",
    press_close_business_to_view:
      "Ngo'yo tic, kadi pot Turo Tic me neno ngo'yo.",
    clear_history_button: "Meco Ngo'yo Tic Duti", // New translation
    confirm_clear_history_title: "Kwero Meco Ngo'yo Tic", // New translation
    confirm_clear_history_message:
      "Ada, in miti me meco data duni duni me tic? Tic ni pe roko doki.", // New translation
    clear_history_cancelled: "Meco ngo'yo tic okano.", // New translation
    history_cleared_success: "Data duni duni me tic omeco!", // New translation
    history_cleared_error: "Kwoyiyo me meco ngo'yo tic.", // New translation
  },
  sog: {
    // Lusoga
    home_heading: "👋 Duka Mu Ngalo",
    record_sale: "Wandiika Ekitundiddwa",
    record_restock: "Wandiika Ekigasse",
    view_summary: "Laba Ebyasumululwa Eby'olunaku",
    view_history: "Laba Ebyafaayo",
    manage_inventory: "Gerayo Eby'ebintu",
    tip_home:
      "🎙️ Tadi: Kozesa akamiki ku kibodi yo okwogera amanya g'ebintu oba omuwendo.",
    item_name: "Eryooba ly'Ekintu",
    quantity: "Omuwendo",
    item_name_placeholder: "Eky'okulabirako: Sukari",
    quantity_placeholder: "Eky'okulabirako: 3",
    cost_price: "Ebeeyi Gye Kiguliddwa (ku kamu)",
    selling_price: "Ebeeyi Gye Kitundibwa (ku kamu)",
    record_transaction: "Wandiika Enkozesa",
    sale_recorded: "Ekitundiddwa kiwandiddwa bulungi",
    restock_recorded: "Ekigasse kiwandiddwa bulungi",
    error_saving: "Wabaddewo ensobi mu kuwanika. Kosa nate.",
    item_name_required: "Eryooba ly'ekintu lyetaagisa",
    quantity_required: "Omuwendo gwetaagisa",
    valid_quantity: "Wandiika omuwendo ogulimu",
    tip_transaction:
      "🎤 Tadi: Kanyiga akamiki ku **kibodi** yo okwogera erinnya ly'ekintu oba omuwendo.",
    record_a_sale: "Wandiika Ekitundiddwa",
    record_a_restock: "Wandiika Ekigasse",
    todays_summary: "Ebyasumululwa Eby'olunaku",
    sales: "Omuwendo gw'Ebitundiddwa",
    restocks: "Omuwendo gw'Ebigasse",
    transaction_history: "Ebyafaayo By'enkuze",
    no_transactions: "Tewali nkuze n'emu.",
    sold: "Kitundiddwa",
    restocked: "Kigasse",
    select_language: "Londa Olulimi:",
    english: "Lungereza",
    luganda: "Luganda",
    swahili: "Kiswahili",
    runyakitara: "Runyakitara",
    acholi: "Acholi",
    lango: "Lango",
    lusoga: "Lusoga",
    voice_error: "Okumanya okw'amajwi kulemedde. Kosa nate.",
    inventory_title: "Eby'ebintu Mu Duka",
    add_new_item: "Gatta Ekintu Ekiggya",
    no_inventory_items: "Tewali bintu bya nkuze n'emu.",
    current_stock: "Omuwendo Oguliwo",
    edit_item: "Kyusa Ekintu",
    save_item: "Wanika Ekintu",
    item_saved: "Ekintu kiwaniddwa bulungi!",
    item_deleted: "Ekintu kiggiddwawo bulungi!",
    confirm_delete: "Oli mukakasa okuggyawo ekintu kino?",
    insufficient_stock: "Omuwendo tegwamala okutunda.",
    item_not_found: "Ekintu tekyasanyiziddwa mu by'ebintu.",
    error_loading_summary: "Wabaddewo ensobi mu kuleeta ebyasumululwa.",
    inventory_value_cost: "Ebeeyi y'Eby'ebintu (Ekyaguliddwa)",
    inventory_value_sales: "Ebeeyi y'Eby'ebintu (Ebyanditundiddwa)",
    total_sales_revenue: "Omuwendo gwonna gw'Ebitundiddwa (Ekiseera Kino)",
    total_cost_of_restocks: "Omuwendo gwonna gw'Okugassa (Ekiseera Kino)",
    item_total_cost_value: "Omuwendo Gwonna Ogw'ensigo (ekintu kino)",
    item_total_selling_value: "Omuwendo Gwonna Ogw'okutunda (ekintu kino)",
    clear_inventory_button: "Ggyaho Eby'ebintu Byonna",
    confirm_clear_inventory_title: "Kakasa Okuggyaho Eby'ebintu",
    confirm_clear_inventory_message:
      "Oli mukakasa ddala okuggyaho data YONNA ey'eby'ebintu? Kino tekisobola kudibizibwa.",
    clear_inventory_cancelled: "Okuggyaho eby'ebintu kwaniziddwa.",
    inventory_cleared_success: "Eby'ebintu byonna biggiddwawo bulungi!",
    inventory_cleared_error: "Wabaddewo ensobi mu kuggyaho eby'ebintu.",
    close_business: "Ggala Bizineesi (Kubala & Sumulula)",
    confirm_close_business_title: "Kakasa Okuggala Bizineesi",
    confirm_close_business_message:
      "Oli mukakasa okuggala bizineesi ku kiseera kino? Kii kigya kubala ebyasumululwa era kisumulule ekiseera ky'enkozesa eziddako.",
    close_business_cancelled: "Okuggala bizineesi kwaniziddwa.",
    close_business_success:
      "Bizineesi eggaddwa n'ebyasumululwa bibaliddwa bulungi!",
    close_business_error:
      "Wabaddewo ensobi mu kuggala bizineesi n'ebyasumululwa.",
    no_summary_data:
      "Kanyiga 'Ggala Bizineesi' okulaba ebyasumululwa by'ekiseera kino.",
    no_transactions_for_period:
      "Tewali nkozesa ziwandiikiddwa mu kiseera kino.",
    no_new_transactions_to_close:
      "Tewali nkozesa mpya za kuggyaho mu kiseera kino.",
    press_close_business_to_view:
      "Wandiika enkozesa, oluvanyuma kanyiga 'Ggala Bizineesi' okulaba ebyasumululwa.",
    clear_history_button: "Ggyaho Ebyafaayo Byonna", // New translation
    confirm_clear_history_title: "Kakasa Okuggyaho Ebyafaayo", // New translation
    confirm_clear_history_message:
      "Oli mukakasa ddala okuggyaho data YONNA ey'ebyokukola? Kino tekisobola kudibizibwa.", // New translation
    clear_history_cancelled: "Okuggyaho ebyafaayo kwaniziddwa.", // New translation
    history_cleared_success: "Ebyafaayo byonna biggiddwawo bulungi!", // New translation
    history_cleared_error: "Wabaddewo ensobi mu kuggyaho ebyafaayo.", // New translation
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en"); // Default language

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("appLanguage");
        if (savedLanguage && translations[savedLanguage]) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.error("Failed to load language from AsyncStorage", error);
      }
    };
    loadSavedLanguage();
  }, []);

  const setAppLanguage = async (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
      try {
        await AsyncStorage.setItem("appLanguage", lang);
      } catch (error) {
        console.error("Failed to save language to AsyncStorage", error);
      }
    } else {
      console.warn(`Language '${lang}' not supported.`);
    }
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setAppLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
