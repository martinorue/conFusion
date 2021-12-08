import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { ActivatedRoute, Params } from '@angular/router';
import { Location } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from '../shared/comment';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    trigger('visibility', [
      state('shown', style({
        transform: 'scale(1.0)',
        opacity: 0
      })),
      state('hidden', style({
        transform: 'scale(0.5)',
        opacity: 0
      })),
      transition('* => *', animate('0.5s ease-in-out'))
    ])
  ]
})
export class DishdetailComponent implements OnInit {

  dish?: Dish;
  dishcopy?: Dish;
  errMess!: string;
  dishIds!: string[];
  prev!: string;
  next!: string;
  feedbackForm!: FormGroup;
  comment!: Comment;
  visibility = 'shown';


  @ViewChild('fform') feedbackFormDirective: any;

  formErrors: any = {
    'author': '',
    'rating': 5,
    'comment': '',
  };

  validationMessages: any = {
    'author': {
      'required': 'Author is required',
      'minlength': 'Author must be at least 2 characters long',
    },
    'comment': {
      'required': 'Comment is required',
    },
  }

  constructor(private dishservice: DishService,
    private route: ActivatedRoute,
    private location: Location, private fb: FormBuilder, @Inject('BaseURL') private BaseURL: string) {
    this.createForm();
  }

  ngOnInit() {
    this.dishservice.getDishIds().subscribe(dishIds => this.dishIds = dishIds);
    this.route.params
      .pipe(switchMap((params: Params) => {
        this.visibility = 'hidden';
        return this.dishservice.getDish(params['id']);
      }))
      .subscribe(dish => 
        { 
        this.dish = dish; this.dishcopy = dish, 
        this.setPrevNext(dish.id); 
        this.visibility = 'shown'; 
      },
        errmess => this.errMess = <any>errmess);
  }

  createForm() {
    this.feedbackForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)]],
      rating: [5, [Validators.required]],
      comment: ['', [Validators.required]]
    });

    this.feedbackForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set form validation messages
  }


  onValueChanged(data?: any) {
    if (!this.feedbackForm) { return; }

    const form = this.feedbackForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }


  onSubmit() {
    this.comment = this.feedbackForm.value;
    // this.feedback.pregunta = this.pregunta; --> idea para traerme la info de la pregunta
    // o sino
    //this.feedback.pregunta = this.feedbackForm.value.pregunta;
    const d = new Date();
    let date = d.toISOString();
    this.comment.date = date;

    if (this.dishcopy) {
      this.dishcopy.comments.push(this.comment);
      this.dishservice.putDish(this.dishcopy)
        .subscribe(dish => {
          this.dish = dish; this.dishcopy = dish;
        },
          errmess => { this.dish = null || undefined; this.dishcopy = null || undefined; this.errMess = <any>errmess; });
      this.feedbackFormDirective.resetForm();

      this.feedbackForm.reset({
        author: '',
        rating: 5,
        comment: ''
      });
    }

  }


  setPrevNext(dishId: string) {// Angular and RxJS Part 2
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

}
