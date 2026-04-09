export const WebBookEngine_Page = {
    // Selectors mapped to DOM elements on the WebBook Engine Page
    
    // Header & Global controls
    engine_title: "//h1[contains(normalize-space(.), 'Evolutionary Web-Book Engine')]",
    history_button: "button[title='View and manage previously generated Web-books']",

    // Control Sidebar Forms
    targeted_ingestion_section: "//h2[contains(normalize-space(.), 'Targeted Ingestion')]",
    search_input: "textarea[placeholder='Search for topic...']",
    search_button: "button[title='Execute evolutionary synthesis pipeline']",
    new_search_button: "//button[contains(normalize-space(.), 'New Search')]",

    // Metrics Panel
    evolutionary_metrics_section: "//h2[contains(normalize-space(.), 'Evolutionary Metrics')]",
    status_label: "//span[normalize-space(.)='Status']/following-sibling::span",
    generation_number: "//span[normalize-space(.)='Generation']/following-sibling::span",
    pop_size_number: "//span[contains(normalize-space(.), 'Pop. Size')]/following-sibling::span",
    show_artifacts_button: "//button[contains(normalize-space(.), 'Show Artifacts')]",
    hide_artifacts_button: "//button[contains(normalize-space(.), 'Hide Artifacts')]",

    // PDF Export / Action controls
    export_menu_button: "button[title='Download or print this Web-book in various formats']",
    print_pdf_button: "button[title='Open system print dialog (recommended for large books)']",
    export_high_res_pdf_button: "button[title='Generate a high-quality PDF with images and styling']",
    
    // Viewer
    webbook_viewer_placeholder: "//p[contains(normalize-space(.), 'Enter a topic to generate a structured Web-book')]",
    generated_book_title: ".web-book-container h2",
    generated_book_content: ".web-book-container"
};
