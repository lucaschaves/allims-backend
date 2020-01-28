const getCmStates = `
  query {
    allCmStates { 
      nodes { 
        state 
        pkState 
      } 
    } 
  }
`;

module.exports = getCmStates