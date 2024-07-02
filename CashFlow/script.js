let numFriends;
let friendNames = [];
let transactions = [];
let transactionCount = 0;

function start() {
    numFriends = parseInt(document.getElementById('numFriends').value);
    if (isNaN(numFriends) || numFriends < 2) {
        alert("Please enter a valid number of friends (minimum 2). 🙏");
        return;
    }

    transactions = Array.from({ length: numFriends }, () => new Array(numFriends).fill(0));
    document.getElementById('friendCountSection').classList.add('hidden');
    document.getElementById('friendNamesSection').classList.remove('hidden');
    renderFriendNameInputs();
}

function renderFriendNameInputs() {
    const container = document.getElementById('friendNamesContainer');
    container.innerHTML = '';
    for (let i = 0; i < numFriends; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = `Friend ${i + 1} name 🤗`;
        input.id = `friendName${i}`;
        container.appendChild(input);
        container.appendChild(document.createElement('br'));
    }
}

function nextToTransactions() {
    friendNames = [];
    for (let i = 0; i < numFriends; i++) {
        const name = document.getElementById(`friendName${i}`).value;
        if (!name) {
            alert("Please enter all friend names. 🙏");
            return;
        }
        friendNames.push(name);
    }
    populatePayerDropdown();
    populatePayeesDropdown();
    document.getElementById('friendNamesSection').classList.add('hidden');
    document.getElementById('transactionsSection').classList.remove('hidden');
}

function populatePayerDropdown() {
    const payerSelect = document.getElementById('payer');
    payerSelect.innerHTML = '';
    friendNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        payerSelect.appendChild(option);
    });
}

function populatePayeesDropdown() {
    const payeesContainer = document.getElementById('payeesContainer');
    payeesContainer.innerHTML = '';
    addPayee(); // Initialize with one payee dropdown
}

function addPayee() {
    const payeesContainer = document.getElementById('payeesContainer');
    const select = document.createElement('select');
    select.className = 'payee';
    friendNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
    payeesContainer.appendChild(select);
}

function selectAllPayees() {
    const payeesContainer = document.getElementById('payeesContainer');
    payeesContainer.innerHTML = '';
    const select = document.createElement('select');
    select.className = 'payee';
    select.multiple = true;
    const payer = document.getElementById('payer').value;
    friendNames.forEach(name => {
        if (name !== payer) {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            option.selected = true;
            select.appendChild(option);
        }
    });
    payeesContainer.appendChild(select);
}

function recordTransaction() {
    const payer = document.getElementById('payer').value;
    const payees = Array.from(document.querySelectorAll('.payee option:checked')).map(option => option.value);
    const amount = parseFloat(document.getElementById('amount').value);
    const details = document.getElementById('details').value;
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount. 💰");
        return;
    }

    const payerIndex = friendNames.indexOf(payer);
    if (payerIndex === -1) {
        alert(`Payer "${payer}" is not in the friend list. 😱`);
        return;
    }

    if (payees.length === 0) {
        alert("Please select at least one payee. 🙏");
        return;
    }

    if (payees.length === numFriends - 1) {
        const dividedAmount = amount / numFriends;
        for (let i = 0; i < numFriends; i++) {
            if (i !== payerIndex) {
                transactions[payerIndex][i] += dividedAmount;
            }
        }
    } else {
        const payeeIndexes = [];
        payees.forEach(payee => {
            const payeeIndex = friendNames.indexOf(payee);
            if (payeeIndex === -1) {
                alert(`Payee "${payee}" is not in the friend list. 😱`);
                return;
            }
            payeeIndexes.push(payeeIndex);
        });

        const dividedAmount = amount / payees.length;
        payeeIndexes.forEach(payeeIndex => {
            transactions[payerIndex][payeeIndex] += dividedAmount;
        });
    }
    transactionCount++;
    document.getElementById('payeesContainer').innerHTML = '';
    populatePayeesDropdown();
    document.getElementById('amount').value = '';
    document.getElementById('details').value = '';
    logTransaction(payer, payees, amount, details);
}

function logTransaction(payer, payees, amount, details) {
    const logContainer = document.getElementById('transactionsLog');
    const logEntry = document.createElement('div');
    logEntry.textContent = `${payer} paid ${amount} for ${payees.join(', ')}${details ? ` (${details})` : ''}`;
    logContainer.appendChild(logEntry);
}

function finishTransactions() {
    minimizeCashFlow(transactions, friendNames);
    document.getElementById('transactionsSection').classList.add('hidden');
    document.getElementById('resultSection').classList.remove('hidden');
}

function minimizeCashFlow(transactions, friendNames) {
    const numFriends = transactions.length;

    const netAmount = new Array(numFriends).fill(0);
    for (let p = 0; p < numFriends; p++) {
        for (let q = 0; q < numFriends; q++) {
            netAmount[p] += transactions[q][p] - transactions[p][q];
        }
    }

    function getMax(netAmount) {
        let maxIndex = 0;
        for (let i = 1; i < netAmount.length; i++) {
            if (netAmount[i] > netAmount[maxIndex]) {
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    function getMin(netAmount) {
        let minIndex = 0;
        for (let i = 1; i < netAmount.length; i++) {
            if (netAmount[i] < netAmount[minIndex]) {
                minIndex = i;
            }
        }
        return minIndex;
    }

    function settleDebt(netAmount, payments) {
        const maxCreditor = getMax(netAmount);
        const maxDebtor = getMin(netAmount);

        if (netAmount[maxCreditor] === 0 && netAmount[maxDebtor] === 0) {
            return;
        }

        const minAmount = Math.min(-netAmount[maxDebtor], netAmount[maxCreditor]);
        netAmount[maxCreditor] -= minAmount;
        netAmount[maxDebtor] += minAmount;

        payments.push({ from: maxDebtor, to: maxCreditor, amount: minAmount });

        settleDebt(netAmount, payments);
    }

    const payments = [];
    settleDebt(netAmount, payments);

    const resultContainer = document.getElementById('results');
    resultContainer.innerHTML = '';
    payments.forEach(payment => {
        resultContainer.innerHTML += `${friendNames[payment.to]} has to pay ${payment.amount} to ${friendNames[payment.from]} 💸\n`;
    });
}
