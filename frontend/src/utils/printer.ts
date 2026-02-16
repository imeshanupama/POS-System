import { type Sale } from '../services/api';

export const printReceipt = (sale: Sale, itemsWithNames: { name: string, quantity: number, price: number }[]) => {
    const shopName = "My Shop";
    const shopAddress = "123 Main St, Colombo";
    const shopPhone = "011-1234567";
    const date = new Date().toLocaleString();

    const itemsHtml = itemsWithNames.map(item => `
    <tr>
      <td style="padding: 2px 0;">${item.name}</td>
      <td style="text-align: right; padding: 2px 0;">${item.quantity}</td>
      <td style="text-align: right; padding: 2px 0;">${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

    const receiptHtml = `
    <html>
      <head>
        <title>Receipt #${sale.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 5px; font-size: 12px; }
          .header { text-align: center; margin-bottom: 10px; }
          h1 { margin: 0; font-size: 16px; font-weight: bold; }
          p { margin: 2px 0; }
          .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; border-bottom: 1px solid #000; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; display: flex; justify-content: space-between; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${shopName}</h1>
          <p>${shopAddress}</p>
          <p>Tel: ${shopPhone}</p>
        </div>
        
        <div class="divider"></div>
        <p>Date: ${date}</p>
        <p>Receipt #: ${sale.id || 'N/A'}</p>
        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="width: 50%">Item</th>
              <th style="width: 20%; text-align: right">Qty</th>
              <th style="width: 30%; text-align: right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="total">
          <span>TOTAL:</span>
          <span>LKR ${sale.total_amount.toFixed(2)}</span>
        </div>
        <p>Payment: ${sale.payment_method.toUpperCase()}</p>

        <div class="footer">
          <p>Thank you for your purchase!</p>
          <p>Please come again.</p>
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

    const printWindow = window.open('', '', 'height=600,width=400');
    if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
    } else {
        alert("Popup blocked! Please allow popups for receipt printing.");
    }
};
