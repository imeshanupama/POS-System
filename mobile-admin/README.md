# POS Mobile Admin

A Flutter application for shop owners to monitor sales and inventory remotely.

## Getting Started

1.  **Backend Setup**: Ensure your Node.js backend is running.
    *   `cd backend`
    *   `npm run dev`

2.  **Configure API URL**:
    *   Open `lib/main.dart`.
    *   Find `static const String baseUrl`.
    *   **iOS Simulator / macOS Desktop**: `http://localhost:3000/api`
    *   **Android Emulator**: `http://10.0.2.2:3000/api`
    *   **Physical Device**: Use your computer's LAN IP (e.g., `http://192.168.1.5:3000/api`).

3.  **Run the App**:
    ```bash
    flutter pub get
    # Run on iOS Simulator
    flutter run -d ios
    # Run heavily faster on macOS Desktop for testing
    flutter run -d macos
    ```

## Features

*   **Dashboard**: View Total Revenue, Today's Sales Count, and Today's Revenue.
*   **Recent Transactions**: List of the latest 5 transactions.
*   **Pull-to-Refresh**: Swipe down to update data.
