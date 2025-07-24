Make the form input have suggestions as the user enters in the input field(narrowing down the list as more exact matches as reached). This can be done in the 
Appropriately handle the ProductNotFound Scenarion in the TransactionScreen file
When adding a network or editing a network, the user should capture include the commission rates for withdraw and deposit `{
    id: "NET001",
    name: "Mtn",
    commissionRate: {
      deposit: 0.005,
      withdrawal: 0.015,
    },
    float: 500000,
    voiceKeywords: [
      "mtn", // Crucial short term for easy voice entry
      "mtn mobile money",
      "mtn momo",
      "yellow money",
      "momo",
      "mtn cash",
      "momo mtn",
      "m t n", // Pronunciation helper
    ],
  },`
