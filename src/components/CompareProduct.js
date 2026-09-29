import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Redirect } from 'react-router-dom';
import { GitCompareArrows } from 'lucide-react';
import { Card, Select, Field, Button } from './ui';

const baseURL = "/api/products/all/";

const CompareProduct = () => {
    const [productss, setProductss] = useState([])
    const [isPC, setIsPC] = useState(false);
    const [gt, setGt] = useState({
        laptop_1: "",
        laptop_2: "",
    });

    useEffect(() => {
        axios.get(baseURL).then((response) => {
            setProductss(response.data)
        }).catch((error) => console.log(error));
    }, []);

    const handleChange = (e) => {
        setGt({ ...gt, [e.target.name]: e.target.value })
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        if (gt.laptop_1 === "" || gt.laptop_2 === "") {
            alert("You did not fill up both input field please try again")
        }
        else if (gt.laptop_1 === gt.laptop_2) {
            alert("Both Value Are Same. Please Try different value");
        }
        else {
            setIsPC(true);
        }
    }

    if (isPC) {
        return (
            <Redirect
                to={{
                    pathname: "/compare",
                    state: {
                        lep1: gt.laptop_1,
                        lep2: gt.laptop_2,
                    }
                }}
            />
        )
    }

    return (
        <Card className="p-5">
            <form onSubmit={handleSubmit}>
                <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                        <GitCompareArrows className="h-4 w-4" />
                    </span>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-900">Compare two products</h3>
                        <p className="text-xs text-slate-500">Details and price history side by side</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <Field label="First product" id="laptop_1">
                        <Select id="laptop_1" name="laptop_1" onChange={handleChange} className="h-10">
                            <option value="">Choose a product</option>
                            {productss.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </Select>
                    </Field>
                    <Field label="Second product" id="laptop_2">
                        <Select id="laptop_2" name="laptop_2" onChange={handleChange} className="h-10">
                            <option value="">Choose a product</option>
                            {productss.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </Select>
                    </Field>
                </div>
                <Button type="submit" variant="dark" block className="mt-4">Compare</Button>
            </form>
        </Card>
    );
}
export default CompareProduct;
