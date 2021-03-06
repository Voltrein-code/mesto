//импорт необходимых модулей
import './index.css';

import {
  editButton, addButton, popupEdit, popupAdd, popupCard, inputName, inputCaption, cardContent,
  cardList, profileName, profileCaption, addPopupButton, serverUrl, serverToken, popupDelete,
  selectorObject, avatarEditButton, popupAvatar
} from '../utils/data.js';

import Card from '../components/Card.js';
import FormValidator from '../components/FormValidator.js';
import Section from '../components/Section.js';
import PopupWithImage from '../components/PopupWithImage.js';
import PopupWithForm from '../components/PopupWithForm.js';
import PopupWithSubmit from '../components/PopupWithSubmit.js'
import UserInfo from '../components/UserInfo.js';
import Api from '../components/Api.js';

const api = new Api({
  baseUrl: serverUrl,
  headers: {
    authorization: serverToken,
    'Content-Type': 'application/json'
  }
});

//получение информации о пользователе с сервера и отрисовка
const currentUser = new UserInfo({ nameSelector: profileName, captionSelector: profileCaption });

api.getUserInfo()
  .then((user) => {
    currentUser.setUserInfo(user);
    currentUser.setUserAvatar(user.avatar);
    renderCards();
  })

const initialCardsAdder = new Section({
  renderer: (item) => {
    createCard(item, true);
  }
}, cardList)

//создание экземпляров попап
const popupAddForm = new PopupWithForm({
  popupSelector: popupAdd, handleFormSubmit: (item) => {
    popupAddForm.renderLoading(true);
    api.addCard(item)
      .then((res) => {
        createCard(res, false);
        validateAddForm.deactivateButton(addPopupButton);
        popupAddForm.close();
      })
      .catch((err) => {
        console.log(err);
      })
  }
});

const popupEditForm = new PopupWithForm({
  popupSelector: popupEdit, handleFormSubmit: (item) => {
    popupEditForm.renderLoading(true);
    api.setUserInfo(item)
      .then((data) => {
        currentUser.setUserInfo(data);
        popupEditForm.close();
      })
      .catch((err) => {
        console.log(err);
      })
  }
});

const popupAvatarForm = new PopupWithForm({
  popupSelector: popupAvatar, handleFormSubmit: (item) => {
    popupAvatarForm.renderLoading(true);
    api.setAvatar(item)
      .then((data) => {
        currentUser.setUserAvatar(data.avatar);
        popupAvatarForm.close();
      })
      .catch((err) => {
        console.log(err);
      })
  }
})

const popupCardForm = new PopupWithImage(popupCard);

const popupCardDelete = new PopupWithSubmit(popupDelete);

//установка слушателей на попапы
popupAddForm.setEventListeners();
popupEditForm.setEventListeners();
popupCardForm.setEventListeners();
popupCardDelete.setEventListeners();
popupAvatarForm.setEventListeners();

//включение валидации форм
const validateAddForm = new FormValidator(selectorObject, popupAdd);
const validateEditForm = new FormValidator(selectorObject, popupEdit);
const validateAvatarForm = new FormValidator(selectorObject, popupAvatar);
validateAddForm.enableValidation();
validateEditForm.enableValidation();
validateAvatarForm.enableValidation();

//прогрузка карточек
function renderCards() {
  api.getCards()
  .then((data) => {
    initialCardsAdder.render(data);
  })
  .catch((err) => {
    console.log(err);
  })
}

//открытие карточки в окне попап
function handleCardClick(el) {
  popupCardForm.open(el.name, el.link)
}

//удаление карточки с сервера и из DOM
function handleCardDelete(card) {
  popupCardDelete.open(() => {
    api.deleteCard(card._cardData._id)
      .then(() => {
        card.deleteCard();
        popupCardDelete.close();
      })
      .catch((err) => {
        console.log(`${err}`);
      })
    console.log(card)
  })
}

//лайк карточки
function handleCardLike(card, data) {
  const likePromise = card.isLiked() ? api.dislike(data._id) : api.like(data._id);

  likePromise
    .then((data) => {
      card.setLike(data);
    })
    .catch((err) => {
      console.log(`${err}`);
  });
}

//создание карточки
function createCard(item, isInitial) {
  const newCardAdder = new Card(cardContent, item, currentUser.userId, handleCardClick, {handleCardDelete: () => {
    handleCardDelete(newCardAdder);
  },
    handleLikeCard: () => {
      handleCardLike(newCardAdder, item);
    }
});

  const cardElement = newCardAdder.getCard();
  newCardAdder.setLike(item);
  initialCardsAdder.addItem(cardElement, isInitial);
}
//События
addButton.addEventListener('click', () => popupAddForm.open());
avatarEditButton.addEventListener('click', () => popupAvatarForm.open());
editButton.addEventListener('click', () => {
  const userData = currentUser.getUserInfo();

  inputName.value = userData.name;
  inputCaption.value = userData.about;

  popupEditForm.open();
});