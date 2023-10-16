import { Component, OnInit } from '@angular/core';
import { StockDataService } from '../../services/stock-data.service';

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.css'],
})
export class NewsComponent implements OnInit {
  newsData: any[] = [];
  currentIndex = 0;
  interval: any;

  constructor(private stockDataService: StockDataService) {}

  ngOnInit(): void {
    this.stockDataService.getNewsSentiment().subscribe((data: any) => {
      this.newsData = data.feed;
      this.startCarousel();
    });
  }

  startCarousel() {
    setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.newsData.length;
    }, 5000);
  }

  getDisplayedNews() {
    return this.newsData.slice(this.currentIndex, this.currentIndex + 4);
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.newsData.length;
  }

  prevSlide() {
    this.currentIndex =
      (this.currentIndex - 1 + this.newsData.length) % this.newsData.length;
  }
}
