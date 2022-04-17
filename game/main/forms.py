from django import forms


class ChatCreateForm(forms.Form):
    message = forms.CharField()


class MapWalkForm(forms.Form):
    x = forms.IntegerField()
    y = forms.IntegerField()
