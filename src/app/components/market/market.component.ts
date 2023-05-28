import { Component, OnInit, OnDestroy } from '@angular/core';
import { StockDataService } from 'src/app/services/stock-data.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-market',
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.css'],
})
export class MarketComponent implements OnInit, OnDestroy {
  isSmallScreen = false;
  trendingStocks: any[] = [];
  private trendingStocksSubscription: Subscription = new Subscription();

  constructor(private stockService: StockDataService) {}

  ngOnInit() {
    this.trendingStocksSubscription = this.stockService
      .getTrendingStocks()
      .subscribe({
        next: (stocks) => {
          this.trendingStocks = stocks;
        },
        error: (error) => {
          console.log('Error retrieving trending stocks:', error);
        },
      });
  }

  getStockName(index: number): string {
    if (this.trendingStocks[index]) {
      return this.trendingStocks[index].name.split(' ').slice(0, 2).join(' ');
    } else {
      return 'Not Available';
    }
  }

  getStockSymbol(index: number): string {
    if (this.trendingStocks[index]) {
      return this.trendingStocks[index].symbol || '';
    } else {
      return 'NA';
    }
  }

  getStockPrice(index: number): number {
    if (this.trendingStocks[index]) {
      return this.trendingStocks[index].c || 0;
    } else {
      return 0;
    }
  }

  getStockPercentage(index: number): number {
    if (this.trendingStocks[index]) {
      return this.trendingStocks[index].dp || 0;
    } else {
      return 0;
    }
  }

  getMarketCap(index: number): number {
    if (this.trendingStocks[index]) {
      return this.trendingStocks[index].mc.toLocaleString() || 0;
    } else {
      return 0;
    }
  }

  ngOnDestroy() {
    this.trendingStocksSubscription.unsubscribe();
  }
}
