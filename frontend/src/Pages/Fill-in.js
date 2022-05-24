import '../css/Lottery.css'
import '../css/Fill-in.css'
import callrefresh from '../refresh.js';
import React, { useState, useEffect } from 'react';
import ReactLoading from "react-loading";
import { useTranslation } from "react-i18next";

const Fillin = (props) => {


    const FORM_ID = props.form_id; // 傳入想要看的 formID
    const [formContent, setFormContent] = useState([]);
    const [hasAnsweredBefore, sethasAnsweredBefore] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const { t, i18n } = useTranslation();

    // 取得 access token
    // const access_token =  localStorage.getItem('jwt');

    // 使用 useEffect Hook
    useEffect(() => {
        console.log('Fill-in.js: execute function in useEffect');
        let abortController = new AbortController();  
        const fetchData = async () => {
            try{
                await Promise.all([
                    formRespondCheck(),
                    fetchQuestions()
                ]);
                setIsLoading(false);
            }
            catch(err){
                console.log('Fill in page error', err)
            }
        }
        fetchData();
        return () => {  
            abortController.abort();  
        }  
    }, []);  // dependency 

    const formRespondCheck = async () => {
        const response = await fetch(
            `https://be-sdmg4.herokuapp.com/FormRespondentCheck?form_id=${encodeURIComponent(FORM_ID)}`,
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,  //驗證使用者資訊
            }
        });
        if(response.status === 401){
            callrefresh("refresh");
        }
        else{
            const resJson = await response.json();
            console.log("Has Answered Before", resJson);
            sethasAnsweredBefore(resJson["has_responded"]);
        }
    };

    const fetchQuestions = async () => {
        const response = await fetch(
            `https://be-sdmg4.herokuapp.com/GetUserForm?form_id=${encodeURIComponent(FORM_ID)}`,
            {
                method: "GET",
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`,  //驗證使用者資訊
            }});
        if(response.status === 401){
            callrefresh("refresh");
        } 
        else{
            const resJson = await response.json();
            console.log("Form Questions", resJson[0]['questioncontent']);
            setFormContent({
                description: resJson[0]['form_description'],
                picture: resJson[0]['form_pic_url'],
                questions: resJson[0]['questioncontent']
            })
        }           
    };

    //決定要顯示哪些問題
    
    function showQuestion(question){
        const questionBox = [];
        if (question.Type=="單選題"){
            question.Options && question.Options.map(option => {
                questionBox.push ( 
                    <div className='question-card'>
                        <label> {option}</label>
                        <input type="radio" id={question.Question} name={question.Question} value={option} />
                    </div>
                )
            })
            return(questionBox)
        }
        else if (question.Type=="複選題"){
            question.Options && question.Options.map(option => {
                questionBox.push ( 
                    <div className='question-card'>
                        <label> {option}</label>
                        <input type="checkbox" id={question.Question} name={question.Question} value={option} />
                    </div>
                )
            })
            return(questionBox)
        }
        else if (question.Type=="簡答題"){
            return (
                <textarea rows="6" type="text" placeholder="Answer" className='input-columns' name={question.Question}
                style={{width: "100%", height:"90px"}}/>
            )
        }
    }

    function showQuestion_disabled(question){
        const questionBox = [];
        if (question.Type=="單選題"){
            question.Options && question.Options.map(option => {
                questionBox.push ( 
                    <div className='question-card'>
                        <label> {option}</label>
                        <input type="radio" id={question.Question} name={question.Question} value={option} disabled/>
                    </div>
                )
            })
            return(questionBox)
        }
        else if (question.Type=="複選題"){
            question.Options && question.Options.map(option => {
                questionBox.push ( 
                    <div className='question-card'>
                        <label> {option}</label>
                        <input type="checkbox" id={question.Question} name={question.Question} value={option} disabled />
                    </div>
                )
            })
            return(questionBox)
        }
        else if (question.Type=="簡答題"){
            return (
                <textarea rows="6" type="text" placeholder="Answer" className='input-columns' name={question.Question}
                style={{width: "100%", height:"90px"}} disabled/>
            )
        }
    }



    // 提交回答
    const handleSubmit = async(e) => {
        e.preventDefault();
        // 取得表單回覆
        const formData = new FormData(e.target);
        const formProps = Object.fromEntries(formData);
        const tempAnsList = [];
        var continued = 1;
        for(const key in formProps ){
            if (formProps[key] ==""){
                alert(key+ "\n 需要填答此問題，才能成功提交表單，參加抽獎喔！");
                continued = 0;
            } else {
                const tempAns = {
                    Question : key,
                    Answer : formProps[key]
                }
                tempAnsList.push(tempAns)
            }
        }
        if(continued === 1){
            console.log("TempAnsList", tempAnsList) // 印出回傳結果看一下，可刪掉
            const result = await fetch("https://be-sdmg4.herokuapp.com/FillForm", {
                method: "POST",
                body: JSON.stringify({
                    form_id: props.form_id,
                    answercontent: tempAnsList,
                }),
                headers:{
                    Authorization: `Bearer ${localStorage.getItem('jwt')}`
                }
            });
            if(result.status === 401){
                callrefresh();
            }
            else{
                let resJson = await result.json();
                console.log("submit status", resJson.status);
                alert(resJson.message);
                window.location.reload();
            }
        }
    }



    return (
        <>
        {/* 問卷左半部問卷題目，如果用戶已經填答過 */}
        <section className='lottery-results card-shadow'>
            <h1> {props.form_title} </h1>
            {isLoading ? <> <div className="loading-container"> <ReactLoading type="spinningBubbles" color="#432a58" /> </div></> : 
            <>
                <section className='form-description'> {formContent.description} </section>
                    {hasAnsweredBefore  ?  <><br /><section className='form-description alert'> 你已經填答過此問卷摟！ </section></>:null}
                    {!(localStorage.getItem('jwt'))  &&  <><br /><section className='form-description alert'> 先登入才能填寫問卷喔。 </section></>}
                    {/* 所有問題會顯示在這邊 */}
                    <div className='questions'>
                        <form onSubmit={handleSubmit} >
                        {formContent.questions && formContent.questions.map(question => {
                            return (
                                <div key={question.Question}>
                                    <h3> {question.Question} </h3>
                                    {hasAnsweredBefore || !(localStorage.getItem('jwt')) ? showQuestion_disabled(question) :  showQuestion(question)}
                                </div>
                        )})}
                        <br/>
                        {hasAnsweredBefore || !(localStorage.getItem('jwt')) ? 
                         <input type="submit" className='general-button Btn' value={t("送出表單")} disabled/>
                            :  <input type="submit" className='general-button Btn' value={t("送出表單")} />}

                        </form>
                    </div>
            </>
            }
        </section>
        </>
    )
}
export { Fillin }