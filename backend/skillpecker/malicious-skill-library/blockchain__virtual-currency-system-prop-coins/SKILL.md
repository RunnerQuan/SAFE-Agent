---
name: Virtual Currency System (Prop Coins)
description: Rules, patterns, and anti-cheating for virtual currency
when_to_use: Working with Prop Coins, wagers, transactions, or balance
version: 1.0.0
languages: swift
---

# Virtual Currency System

## CRITICAL: Virtual Only

**THIS IS NOT REAL MONEY**

- Always call it "Prop Coins"
- Never "cash", "money", or "dollars"
- No conversion to real currency
- "For entertainment only" disclaimers
- No payment processing
- App Store compliant (no gambling)

## Starting Balance

```swift
struct CurrencyConstants {
    static let startingBalance = 1000
    static let dailyReward = 100
    static let minimumWager = 10
}
```

## CurrencyManager Implementation

```swift
@MainActor
class CurrencyManager: ObservableObject {
    static let shared = CurrencyManager()
    
    @Published private(set) var balance: Int
    @Published private(set) var transactions: [Transaction] = []
    
    private var lockedFunds: [UUID: Int] = [:]
    private let queue = DispatchQueue(label: "currency.serial")
    
    private init() {
        self.balance = UserDefaults.standard.integer(forKey: "balance")
        if balance == 0 {
            balance = CurrencyConstants.startingBalance
            saveBalance()
        }
    }
    
    // MARK: - Wager Management
    
    func canWager(_ amount: Int) -> Bool {
        return amount >= CurrencyConstants.minimumWager && amount <= availableBalance
    }
    
    var availableBalance: Int {
        let locked = lockedFunds.values.reduce(0, +)
        return balance - locked
    }
    
    func lockWager(_ amount: Int, for gameID: UUID) -> Bool {
        guard canWager(amount) else { return false }
        
        queue.sync {
            lockedFunds[gameID] = amount
        }
        
        return true
    }
    
    func unlockWager(for gameID: UUID) {
        queue.sync {
            lockedFunds.removeValue(forKey: gameID)
        }
    }
    
    // MARK: - Transactions
    
    func addCoins(_ amount: Int, reason: TransactionReason) {
        queue.async { [weak self] in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.balance += amount
                self.recordTransaction(amount, reason: reason)
                self.saveBalance()
            }
        }
    }
    
    func removeCoins(_ amount: Int, reason: TransactionReason) {
        queue.async { [weak self] in
            guard let self = self else { return }
            
            DispatchQueue.main.async {
                self.balance -= amount
                self.recordTransaction(-amount, reason: reason)
                self.saveBalance()
            }
        }
    }
    
    func processGameResult(gameID: UUID, winner: UUID, wager: Int) async {
        let isLocalWinner = (winner == UIDevice.current.identifierForVendor)
        
        queue.sync {
            lockedFunds.removeValue(forKey: gameID)
        }
        
        if isLocalWinner {
            addCoins(wager * 2, reason: .gameWin(gameID: gameID))
        } else {
            // Wager already deducted when locked
            recordTransaction(-wager, reason: .gameLoss(gameID: gameID))
        }
    }
    
    // MARK: - Daily Rewards
    
    func claimDailyReward() -> Bool {
        let lastClaim = UserDefaults.standard.double(forKey: "lastDailyReward")
        let now = Date().timeIntervalSince1970
        
        // 24 hours = 86400 seconds
        guard now - lastClaim > 86400 else {
            return false
        }
        
        addCoins(CurrencyConstants.dailyReward, reason: .dailyReward)
        UserDefaults.standard.set(now, forKey: "lastDailyReward")
        
        return true
    }
    
    // MARK: - Persistence
    
    private func saveBalance() {
        UserDefaults.standard.set(balance, forKey: "balance")
    }
    
    private func recordTransaction(_ amount: Int, reason: TransactionReason) {
        let transaction = Transaction(
            id: UUID(),
            date: Date(),
            amount: amount,
            reason: reason
        )
        
        transactions.insert(transaction, at: 0)
        
        // Keep last 100 transactions
        if transactions.count > 100 {
            transactions = Array(transactions.prefix(100))
        }
        
        saveTransactions()
    }
    
    private func saveTransactions() {
        if let data = try? JSONEncoder().encode(transactions) {
            UserDefaults.standard.set(data, forKey: "transactions")
        }
    }
}
```

## Transaction Types

```swift
struct Transaction: Identifiable, Codable {
    let id: UUID
    let date: Date
    let amount: Int // Positive = gain, negative = loss
    let reason: TransactionReason
}

enum TransactionReason: Codable {
    case dailyReward
    case gameWin(gameID: UUID)
    case gameLoss(gameID: UUID)
    case achievement(name: String)
    case spectatorWin(gameID: UUID)
    case spectatorLoss(gameID: UUID)
    
    var displayName: String {
        switch self {
        case .dailyReward: return "Daily Reward"
        case .gameWin: return "Game Win"
        case .gameLoss: return "Game Loss"
        case .achievement(let name): return "Achievement: \(name)"
        case .spectatorWin: return "Spectator Win"
        case .spectatorLoss: return "Spectator Loss"
        }
    }
}
```

## Wagering Rules

```swift
func validateWager(_ amount: Int, opponentBalance: Int) -> Bool {
    // Minimum
    guard amount >= CurrencyConstants.minimumWager else {
        return false
    }
    
    // Maximum = 10% of smaller balance
    let maxWager = min(availableBalance, opponentBalance) / 10
    guard amount <= maxWager else {
        return false
    }
    
    return true
}
```

## Anti-Cheating

### State Hashing
```swift
extension GameState {
    func computeHash() -> String {
        let data = "\(player1Balance)\(player2Balance)\(wager)\(timestamp)"
        return SHA256.hash(data: data.data(using: .utf8)!)
            .compactMap { String(format: "%02x", $0) }
            .joined()
    }
    
    func isValid() -> Bool {
        return stateHash == computeHash()
    }
}
```

### State Validation
```swift
func validateGameState(_ state: GameState) throws {
    // Check hash
    guard state.isValid() else {
        throw CurrencyError.tamperedState
    }
    
    // Check balances
    guard state.player1Balance >= 0 && state.player2Balance >= 0 else {
        throw CurrencyError.negativeBalance
    }
    
    // Check wager
    guard state.wager >= CurrencyConstants.minimumWager else {
        throw CurrencyError.invalidWager
    }
}
```

## Spectator Betting

```swift
struct SpectatorBet {
    let spectatorID: UUID
    let gameID: UUID
    let predictedWinner: UUID
    let amount: Int
}

func placeSpectatorBet(_ bet: SpectatorBet) -> Bool {
    // Max 50% of player wager
    let maxBet = currentGameWager / 2
    guard bet.amount <= maxBet else {
        return false
    }
    
    // Lock funds
    return lockWager(bet.amount, for: bet.gameID)
}

func processSpectatorBets(gameID: UUID, winner: UUID) {
    let bets = spectatorBets[gameID] ?? []
    
    for bet in bets {
        if bet.predictedWinner == winner {
            // Correct prediction: 2x payout
            addCoins(bet.amount * 2, reason: .spectatorWin(gameID: gameID))
        } else {
            // Wrong prediction: lose bet
            recordTransaction(-bet.amount, reason: .spectatorLoss(gameID: gameID))
        }
        
        unlockWager(for: gameID)
    }
}
```

## Testing Currency System

```swift
class CurrencyManagerTests: XCTestCase {
    var manager: CurrencyManager!
    
    override func setUp() {
        super.setUp()
        manager = CurrencyManager.shared
        // Reset to known state
        manager.balance = 1000
    }
    
    func testWagerValidation() {
        XCTAssertTrue(manager.canWager(10))
        XCTAssertTrue(manager.canWager(100))
        XCTAssertFalse(manager.canWager(5)) // Below minimum
        XCTAssertFalse(manager.canWager(2000)) // Above balance
    }
    
    func testWagerLocking() {
        let gameID = UUID()
        
        XCTAssertTrue(manager.lockWager(100, for: gameID))
        XCTAssertEqual(manager.availableBalance, 900)
        
        // Can't lock more than available
        XCTAssertFalse(manager.lockWager(950, for: UUID()))
    }
    
    func testGameResultProcessing() async {
        let gameID = UUID()
        let winner = UUID()
        let wager = 100
        
        manager.lockWager(wager, for: gameID)
        
        await manager.processGameResult(
            gameID: gameID,
            winner: winner,
            wager: wager
        )
        
        XCTAssertEqual(manager.balance, 1100) // Won 100
    }
    
    func testStateHashing() {
        let state = GameState(
            player1Balance: 1000,
            player2Balance: 1000,
            wager: 100,
            timestamp: Date()
        )
        
        let hash = state.computeHash()
        XCTAssertFalse(hash.isEmpty)
        XCTAssertEqual(hash.count, 64) // SHA256
    }
}
```

## App Store Compliance

### In Info.plist
```xml
<key>NSHumanReadableCopyright</key>
<string>Virtual currency for entertainment only. No real money wagering.</string>
```

### In UI
```swift
struct DisclaimerView: View {
    var body: some View {
        VStack {
            Text("Virtual Currency Only")
                .font(.headline)
            Text("Prop Coins have no real-world value and cannot be exchanged for money.")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
    }
}
```

## When This Skill Activates
- Working with CurrencyManager
- Implementing wagers
- Processing game results
- Adding transactions
- Testing currency logic
- Validating balances

## References
- CurrencyManager.swift
- docs/CURRENCY.md
- Apple App Store Review Guidelines (3.1.1)
