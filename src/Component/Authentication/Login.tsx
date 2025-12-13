import { Link, useNavigate } from "react-router-dom";
import { Col, Container, Form, FormGroup, Input, Label, Row } from "reactstrap";
import { Btn, H3, H4, Image, P } from "../../AbstractElements";
import { dynamicImage } from "../../Service";
import { CreateAccount, DoNotAccount, EmailAddress, ForgotPassword, Href, Password, RememberPassword, SignIn, SignInAccount, SignInWith } from "../../utils/Constant";
import { useState } from "react";
import { toast } from "react-toastify";
import SocialApp from "./SocialApp";
import { API_HELPER } from "../../helpers/ApiHelper";
import { API_WEB_URLS } from "../../constants/constAPI";

const Login = () => {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const SimpleLoginHandle = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append("UserName", email);
    formData.append("UserPassword", password);
    try {
      const response = await API_HELPER.apiPOST_Multipart(API_WEB_URLS.BASE + API_WEB_URLS.LOGIN, formData);
      const userData = response?.data?.response?.[0];
      if (response?.success && userData?.Id) {
        localStorage.setItem("authUser", JSON.stringify(userData));
        localStorage.setItem("login", JSON.stringify(true));
        
        // Redirect based on user type
        const userType = userData?.F_UserType;
        if (userType === 8) {
          navigate(`${process.env.PUBLIC_URL}/reports`); // Admin
        } else {
          navigate(`${process.env.PUBLIC_URL}/employeeReports`); // Employee
        }
      } else {
        toast.error(response?.message || "Login failed");
        navigate(`${process.env.PUBLIC_URL}/login`);
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Unable to login. Please try again.");
    }
  };
  return (
    <Container fluid className="p-0">
      <Row className="m-0">
        <Col xs="12" className="p-0">
          <div className="login-card login-dark">
            <div>
              <div>
                <Link className="logo text-center" to={Href}>
                  <Image className="img-fluid for-light" src={dynamicImage("logo/logo-1.png")} alt="looginpage" />
                  <Image className="img-fluid for-dark" src={dynamicImage("logo/logo.png")} alt="looginpage" />
                </Link>
              </div>
              <div className="login-main">
                <Form className="theme-form" onSubmit={(e) => SimpleLoginHandle(e)}>
                  <H3>{SignInAccount}</H3>
                  <P>{"Enter your email & password to login"}</P>
                  <FormGroup>
                    <Label className="col-form-label">{EmailAddress}</Label>
                    <Input type="text" required placeholder="Test@gmail.com" value={email} name="email" onChange={(event) => setEmail(event.target.value)} />
                  </FormGroup>
                  <FormGroup>
                    <Label className="col-form-label">{Password}</Label>
                    <div className="form-input position-relative">
                      <Input type={show ? "text" : "password"} placeholder="*********" onChange={(event) => setPassword(event.target.value)} value={password} name="password" />
                      <div className="show-hide" onClick={() => setShow(!show)}>
                        <span className="show"> </span>
                      </div>
                    </div>
                  </FormGroup>
                  <FormGroup className="mb-0 form-sub-title">
                    <div className="checkbox p-0">
                      <Input id="checkbox1" type="checkbox" />
                      <Label className="text-muted" htmlFor="checkbox1">
                        {RememberPassword}
                      </Label>
                    </div>
                    <Link to={`${process.env.PUBLIC_URL}/pages/samplepage`}>{ForgotPassword}</Link>
                    <div className="text-end mt-3">
                      <Btn color="primary" block className="w-100">
                        {SignIn}
                      </Btn>
                    </div>
                  </FormGroup>
                  <H4 className="text-muted mt-4 or">{SignInWith}</H4>
                  <SocialApp />
                  <P className="mt-4 mb-0 text-center">
                    {DoNotAccount}
                    <Link className="ms-2" to={`${process.env.PUBLIC_URL}/pages/samplepage`}>
                      {CreateAccount}
                    </Link>
                  </P>
                </Form>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
