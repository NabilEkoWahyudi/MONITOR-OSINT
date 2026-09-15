<template>
  <div style="display:flex;flex-direction:column;gap:10px;">
    <div style="font-size:10px;color:var(--accent-yellow);font-weight:bold;margin-bottom:4px;">📈 GLOBAL MARKETS (DUMMY)</div>
    
    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:4px;border:1px solid var(--border-color);">
      <div style="font-size:11px;font-weight:bold;color:var(--text-main);margin-bottom:6px;">Commodities</div>
      <table class="data-table"><tbody>
        <tr><td class="lbl">BRENT CRUDE</td><td class="val" style="color:#ef4444;">$82.45 <span style="font-size:9px;">▼ -1.2%</span></td></tr>
        <tr><td class="lbl">WTI CRUDE</td><td class="val" style="color:#ef4444;">$78.12 <span style="font-size:9px;">▼ -1.5%</span></td></tr>
        <tr><td class="lbl">GOLD (XAU)</td><td class="val" style="color:#10b981;">$2,450.10 <span style="font-size:9px;">▲ +0.8%</span></td></tr>
        <tr><td class="lbl">SILVER (XAG)</td><td class="val" style="color:#10b981;">$28.40 <span style="font-size:9px;">▲ +1.1%</span></td></tr>
      </tbody></table>
    </div>

    <div style="background:rgba(255,255,255,0.03);padding:8px;border-radius:4px;border:1px solid var(--border-color);">
      <div style="font-size:11px;font-weight:bold;color:var(--text-main);margin-bottom:6px;">Indices</div>
      <table class="data-table"><tbody>
        <tr><td class="lbl">S&P 500</td><td class="val" style="color:#10b981;">5,210.50 <span style="font-size:9px;">▲ +0.3%</span></td></tr>
        <tr><td class="lbl">NASDAQ 100</td><td class="val" style="color:#10b981;">18,100.20 <span style="font-size:9px;">▲ +0.5%</span></td></tr>
        <tr><td class="lbl">FTSE 100</td><td class="val" style="color:#ef4444;">7,850.40 <span style="font-size:9px;">▼ -0.2%</span></td></tr>
        <tr><td class="lbl">NIKKEI 225</td><td class="val" style="color:#ef4444;">38,400.00 <span style="font-size:9px;">▼ -0.8%</span></td></tr>
      </tbody></table>
    </div>

    <div style="font-size:9px;color:var(--text-muted);text-align:center;margin-top:10px;">
      Data market real-time requires premium API.<br>This is placeholder data.
    </div>
  </div>
</template>

<script setup>
</script>
