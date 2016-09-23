console.log('animation test');


var btn = $('.record-bubble'),
    inactiveIcon = $('.record-bubble .ion-android-microphone'),
    activeIcon = $('.record-active'),
    tlRecord = new TimelineMax({paused:true});

 tlRecord.to(btn, 0.01, { boxShadow:'none'} )
         .to(btn, 0.2, {scale:1.5, rotation:360} )
         .to(btn, 0.1, {backgroundColor: "transparent", borderColor:"#48CFC1", borderWidth:'10px', ease: Power4.easeOut})
         .to(btn, 0.1, {borderWidth:'1px'}, '+=0.2')
         .to(inactiveIcon, 0.05,{css:{display:"none" }}, 0.02)
         .to(activeIcon, 0.05,{css:{display:"block"}});





$(btn).on('click', function(){
  tlRecord.reversed() ? tlRecord.play() : tlRecord.reverse();
});