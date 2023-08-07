import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagenotFoundComponent } from './pagenot-found.component';

describe('PagenotFoundComponent', () => {
  let component: PagenotFoundComponent;
  let fixture: ComponentFixture<PagenotFoundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PagenotFoundComponent]
    });
    fixture = TestBed.createComponent(PagenotFoundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
